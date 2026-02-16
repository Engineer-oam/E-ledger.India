import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@shared/config/config.service';
import { PerformanceUtils, ShardingUtils } from '@shared/utils';
import { ConsortiumNode, ConsortiumNodeDocument } from './schemas/consortium-node.schema';
import { Shard, ShardDocument } from './schemas/shard.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

@Injectable()
export class ConsortiumService {
  private readonly logger = new Logger(ConsortiumService.name);
  private readonly targetTPS: number;

  constructor(
    @InjectModel(ConsortiumNode.name) private nodeModel: Model<ConsortiumNodeDocument>,
    @InjectModel(Shard.name) private shardModel: Model<ShardDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private configService: ConfigService,
  ) {
    this.targetTPS = this.configService.consortiumConfig.targetTPS;
    this.logger.log(`Consortium Service initialized with target ${this.targetTPS} TPS`);
  }

  async getPerformanceMetrics(): Promise<any> {
    const nodes = await this.nodeModel.find({ status: 'ACTIVE' });
    const activeShards = await this.shardModel.find({ isActive: true });
    
    const recentTransactions = await this.transactionModel
      .find({ 
        timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
      })
      .sort({ timestamp: -1 });

    const processingTimes = recentTransactions
      .map(tx => tx.processingTime)
      .filter(time => time !== undefined) as number[];

    const metrics = {
      activeNodes: nodes.length,
      activeShards: activeShards.length,
      currentTPS: recentTransactions.length / 60,
      targetTPS: this.targetTPS,
      latency: processingTimes.length > 0 ? 
        PerformanceUtils.calculateMetrics(processingTimes) : 
        { p50: 0, p95: 0, p99: 0, avg: 0 },
      shardDistribution: this.calculateShardDistribution(activeShards)
    };

    return metrics;
  }

  async getAllNodes(): Promise<ConsortiumNode[]> {
    return this.nodeModel.find().sort({ shardId: 1, load: 1 });
  }

  async getAllShards(): Promise<Shard[]> {
    return this.shardModel.find().sort({ shardId: 1 });
  }

  private calculateShardDistribution(shards: Shard[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    shards.forEach(shard => {
      distribution[shard.shardId] = shard.currentLoad;
    });
    return distribution;
  }

  async routeTransaction(actorGLN: string, transactionData: any): Promise<{ shardId: string; nodeId: string }> {
    // Determine shard based on actor GLN
    const shardId = ShardingUtils.getShardId(actorGLN, this.configService.consortiumConfig.shardCount);
    
    // Find the least loaded node in the shard
    const nodesInShard = await this.nodeModel
      .find({ shardId, status: 'ACTIVE' })
      .sort({ load: 1 })
      .limit(1);

    if (nodesInShard.length === 0) {
      throw new Error(`No active nodes found in shard ${shardId}`);
    }

    return {
      shardId,
      nodeId: nodesInShard[0].nodeId
    };
  }
}