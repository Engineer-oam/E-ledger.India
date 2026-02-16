import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/schemas/base-entity.schema';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Transaction extends BaseEntity {
  @Prop({ type: String, required: true, unique: true })
  transactionId: string;

  @Prop({ type: String, required: true })
  senderGLN: string;

  @Prop({ type: String, required: true })
  receiverGLN: string;

  @Prop({ type: String, required: true })
  batchId: string;

  @Prop({ type: String, required: true, enum: ['TRANSFER', 'VERIFY', 'UPDATE', 'CREATE', 'DELETE', 'RETURN'] })
  type: string;

  @Prop({ type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'FAILED', 'ROLLBACK'] })
  status: string;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: String, default: null })
  currency?: string;

  @Prop({ type: String, default: null })
  description?: string;

  @Prop({ type: Number, required: true })
  shardId: number;

  @Prop({ type: String, required: true })
  nodeId: string;

  @Prop({ type: String, default: null })
  blockHash?: string;

  @Prop({ type: String, default: null })
  signature?: string;

  @Prop({ type: String, default: null })
  previousTransactionHash?: string;

  @Prop({ type: String, default: null })
  nonce?: string;

  @Prop({ type: String, default: null })
  publicKey?: string;

  @Prop({ type: Number, default: 0 })
  fee: number;

  @Prop({ type: String, default: null })
  metadata?: string; // JSON string for additional data

  @Prop({ type: Date, default: null })
  confirmedAt?: Date;

  @Prop({ type: String, default: null })
  confirmationBlockHash?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Add indexes for common queries
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ senderGLN: 1 });
TransactionSchema.index({ receiverGLN: 1 });
TransactionSchema.index({ batchId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ shardId: 1 });
TransactionSchema.index({ nodeId: 1 });
TransactionSchema.index({ blockHash: 1 });
TransactionSchema.index({ createdAt: -1 });