import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/schemas/base-entity.schema';

export type ShardDocument = Shard & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Shard extends BaseEntity {
  @Prop({ type: Number, required: true, unique: true })
  shardId: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, enum: ['ACTIVE', 'INACTIVE', 'READ_ONLY', 'MAINTENANCE'] })
  status: string;

  @Prop({ type: String, default: 'healthy' })
  healthStatus: string;

  @Prop({ type: Number, default: 0 })
  nodeCount: number;

  @Prop({ type: Number, default: 0 })
  transactionCapacity: number; // Max TPS capacity

  @Prop({ type: Number, default: 0 })
  currentLoad: number; // Current TPS

  @Prop({ type: String, default: null })
  primaryNodeId?: string;

  @Prop({ type: [String], default: [] })
  replicaNodeIds: string[];

  @Prop({ type: String, default: null })
  region?: string;

  @Prop({ type: Number, default: 0 })
  blockHeight: number;

  @Prop({ type: String, default: null })
  lastBlockHash?: string;

  @Prop({ type: Number, default: 0 })
  totalTransactions: number;

  @Prop({ type: Number, default: 0 })
  totalBlocks: number;

  @Prop({ type: String, default: null })
  encryptionKey?: string;

  @Prop({ type: String, default: null })
  consensusAlgorithm?: string;

  @Prop({ type: String, default: null })
  version?: string;
}

export const ShardSchema = SchemaFactory.createForClass(Shard);

// Add indexes for common queries
ShardSchema.index({ shardId: 1 });
ShardSchema.index({ status: 1 });
ShardSchema.index({ region: 1 });
ShardSchema.index({ primaryNodeId: 1 });
ShardSchema.index({ blockHeight: -1 });