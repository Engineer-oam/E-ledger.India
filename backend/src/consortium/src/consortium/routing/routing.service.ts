import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@shared/config/config.service';

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private configService: ConfigService) {}

  async routeTransaction(actorGLN: string, transactionType: string): Promise<{ shardId: string; nodeId: string }> {
    // India-specific routing logic
    const shardId = this.getShardForGLN(actorGLN);
    const nodeId = this.getNodeForShard(shardId, transactionType);
    
    this.logger.debug(`Routing transaction from ${actorGLN} to shard ${shardId}, node ${nodeId}`);
    
    return { shardId, nodeId };
  }

  private getShardForGLN(gln: string): string {
    // Simple hash-based sharding for now
    const hash = this.simpleHash(gln);
    const shardCount = this.configService.consortiumConfig.shardCount;
    const shardIndex = hash % shardCount;
    return `shard-${shardIndex.toString().padStart(3, '0')}`;
  }

  private getNodeForShard(shardId: string, transactionType: string): string {
    // For now, return a simple node ID
    // In production, this would query the actual node registry
    return `${shardId}-node-001`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async getLoadBalancedNode(shardId: string): Promise<string> {
    // Return the least loaded node in the shard
    // This would integrate with the NodeService in a full implementation
    return `${shardId}-node-001`;
  }
}