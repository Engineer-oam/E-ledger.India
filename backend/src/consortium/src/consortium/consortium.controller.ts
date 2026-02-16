import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ConsortiumService } from './consortium.service';
import { NodeService } from './nodes/node.service';
import { ShardingService } from './sharding/sharding.service';

@Controller('consortium')
export class ConsortiumController {
  constructor(
    private readonly consortiumService: ConsortiumService,
    private readonly nodeService: NodeService,
    private readonly shardingService: ShardingService,
  ) {}

  @Get('metrics')
  async getPerformanceMetrics() {
    return this.consortiumService.getPerformanceMetrics();
  }

  @Get('nodes')
  async getAllNodes() {
    return this.nodeService.getAllNodes();
  }

  @Get('nodes/:nodeId')
  async getNodeById(@Param('nodeId') nodeId: string) {
    return this.nodeService.getNodeById(nodeId);
  }

  @Post('nodes')
  async registerNode(@Body() nodeData: any) {
    return this.nodeService.registerNode(nodeData);
  }

  @Get('shards')
  async getAllShards() {
    return this.shardingService.getAllShards();
  }

  @Get('shards/:shardId')
  async getShardById(@Param('shardId') shardId: string) {
    return this.shardingService.getShardById(shardId);
  }

  @Get('status')
  async getConsortiumStatus() {
    const [nodes, shards, metrics] = await Promise.all([
      this.nodeService.getAllNodes(),
      this.shardingService.getAllShards(),
      this.consortiumService.getPerformanceMetrics()
    ]);

    return {
      totalNodes: nodes.length,
      activeNodes: nodes.filter(n => n.status === 'ACTIVE').length,
      totalShards: shards.length,
      activeShards: shards.filter(s => s.isActive).length,
      performance: metrics
    };
  }
}