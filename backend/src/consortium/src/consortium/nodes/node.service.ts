import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsortiumNode, ConsortiumNodeDocument } from '../schemas/consortium-node.schema';

@Injectable()
export class NodeService {
  private readonly logger = new Logger(NodeService.name);

  constructor(
    @InjectModel(ConsortiumNode.name) private nodeModel: Model<ConsortiumNodeDocument>,
  ) {}

  async registerNode(nodeData: any): Promise<ConsortiumNode> {
    const newNode = new this.nodeModel({
      ...nodeData,
      nodeId: `node-${Date.now()}`,
      status: 'ACTIVE',
      load: 0,
      lastHeartbeat: new Date(),
    });

    const savedNode = await newNode.save();
    this.logger.log(`Registered new node: ${savedNode.nodeId}`);
    return savedNode;
  }

  async getNodeById(nodeId: string): Promise<ConsortiumNode | null> {
    return this.nodeModel.findOne({ nodeId });
  }

  async getAllNodes(): Promise<ConsortiumNode[]> {
    return this.nodeModel.find().sort({ shardId: 1, load: 1 });
  }

  async updateNodeLoad(nodeId: string, load: number): Promise<void> {
    await this.nodeModel.updateOne(
      { nodeId },
      { 
        $set: { 
          load,
          lastHeartbeat: new Date()
        }
      }
    );
  }

  async updateNodeStatus(nodeId: string, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'): Promise<void> {
    await this.nodeModel.updateOne(
      { nodeId },
      { $set: { status } }
    );
  }

  async getNodesByShard(shardId: string): Promise<ConsortiumNode[]> {
    return this.nodeModel.find({ shardId, status: 'ACTIVE' }).sort({ load: 1 });
  }

  async sendHeartbeat(nodeId: string): Promise<void> {
    await this.nodeModel.updateOne(
      { nodeId },
      { $set: { lastHeartbeat: new Date() } }
    );
  }
}