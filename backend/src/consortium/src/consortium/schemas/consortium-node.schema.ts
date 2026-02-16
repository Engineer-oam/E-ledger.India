import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/schemas/base-entity.schema';

export type ConsortiumNodeDocument = ConsortiumNode & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ConsortiumNode extends BaseEntity {
  @Prop({ type: String, required: true, unique: true })
  nodeId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  gln: string; // Global Location Number

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true, enum: ['MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'REGULATOR', 'AUDITOR'] })
  role: string;

  @Prop({ type: String, required: true })
  endpoint: string; // API endpoint for the node

  @Prop({ type: String, required: true, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] })
  status: string;

  @Prop({ type: String, default: 'healthy' })
  healthStatus: string;

  @Prop({ type: Number, default: 0 })
  shardId: number;

  @Prop({ type: String, default: null })
  publicKey?: string; // For cryptographic operations

  @Prop({ type: String, default: null })
  certificate?: string; // TLS certificate

  @Prop({ type: Date, default: null })
  lastHeartbeat?: Date;

  @Prop({ type: Number, default: 0 })
  transactionCount: number;

  @Prop({ type: Number, default: 0 })
  tps: number; // Transactions per second

  @Prop({ type: String, default: null })
  region?: string;

  @Prop({ type: String, default: null })
  ipAddress?: string;

  @Prop({ type: String, default: null })
  version?: string;
}

export const ConsortiumNodeSchema = SchemaFactory.createForClass(ConsortiumNode);

// Add indexes for common queries
ConsortiumNodeSchema.index({ nodeId: 1 });
ConsortiumNodeSchema.index({ gln: 1 });
ConsortiumNodeSchema.index({ status: 1 });
ConsortiumNodeSchema.index({ shardId: 1 });
ConsortiumNodeSchema.index({ role: 1 });
ConsortiumNodeSchema.index({ region: 1 });
ConsortiumNodeSchema.index({ lastHeartbeat: -1 });