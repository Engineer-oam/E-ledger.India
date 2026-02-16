import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@shared/config/config.service';
import { ShardingUtils } from '@shared/utils';
import { Shard, ShardDocument } from '../schemas/shard.schema';

@Injectable()
export class ShardingService {
  private readonly logger = new Logger(ShardingService.name);

  constructor(
    @InjectModel(Shard.name) private shardModel: Model<ShardDocument>,
    private configService: ConfigService,
  ) {
    this.initializeShards();
  }

  private async initializeShards(): Promise<void> {
    const shardCount = this.configService.consortiumConfig.shardCount;
    const existingShards = await this.shardModel.countDocuments();
    
    if (existingShards === 0) {
      this.logger.log(`Initializing ${shardCount} shards for consortium`);
      
      const shardPromises = [];
      for (let i = 0; i < shardCount; i++) {
        const shardId = `shard-${i.toString().padStart(3, '0')}`;
        const hashRange = ShardingUtils.getHashRange(shardId, shardCount);
        
        shardPromises.push(
          this.shardModel.create({
            shardId,
            nodeIds: [],
            hashRangeStart: hashRange.start,
            hashRangeEnd: hashRange.end,
            currentLoad: 0,
            maxCapacity: this.configService.consortiumConfig.targetTPS / shardCount,
            isActive: true,
            region: 'IN' // India-specific
          })
        );
      }
      
      await Promise.all(shardPromises);
      this.logger.log(`Successfully initialized ${shardCount} shards`);
    }
  }

  async getShardById(shardId: string): Promise<Shard | null> {
    return this.shardModel.findOne({ shardId });
  }

  async getAllShards(): Promise<Shard[]> {
    return this.shardModel.find().sort({ shardId: 1 });
  }

  async updateShardLoad(shardId: string, load: number): Promise<void> {
    await this.shardModel.updateOne(
      { shardId },
      { $set: { currentLoad: load } }
    );
  }

  async getShardForIdentifier(identifier: string): Promise<Shard | null> {
    const shardId = ShardingUtils.getShardId(identifier, this.configService.consortiumConfig.shardCount);
    return this.getShardById(shardId);
  }
}