import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from './base-entity.schema';
import { Sector, BatchStatus, TraceEvent } from '../../../types';

export type BatchDocument = Batch & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Batch extends BaseEntity {
  @Prop({ type: String, required: true })
  batchID: string;

  @Prop({ type: String, required: true })
  gtin: string;

  @Prop({ type: String, required: true })
  lotNumber: string;

  @Prop({ type: String, required: true })
  expiryDate: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: String, required: true })
  manufacturerGLN: string;

  @Prop({ type: String, required: true })
  currentOwnerGLN: string;

  @Prop({ type: String, default: null })
  intendedRecipientGLN?: string;

  @Prop({ type: String, enum: BatchStatus, required: true, default: BatchStatus.CREATED })
  status: BatchStatus;

  @Prop({ type: [Object], default: [] }) // Using Object for TraceEvent
  trace: TraceEvent[];

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: String, default: null })
  integrityHash?: string;

  @Prop({ type: String, enum: Sector, required: true })
  sector: Sector;

  @Prop({ type: String, required: true, default: 'IN' })
  country: string;

  // Industry Specific Fields
  @Prop({ type: Number, default: null })
  alcoholContent?: number;

  @Prop({ type: String, default: null })
  category?: string;

  @Prop({ type: Boolean, default: null })
  dutyPaid?: boolean;

  @Prop({ type: String, default: null })
  dosageForm?: string;

  @Prop({ type: String, default: null })
  serialNumber?: string;

  // GST Compliance Fields
  @Prop({ type: String, default: null })
  hsnCode?: string;

  @Prop({ type: Number, default: null })
  taxableValue?: number;

  @Prop({ type: Number, default: null })
  taxRate?: number;

  @Prop({ type: Number, default: null })
  taxAmount?: number;

  @Prop({ type: Number, default: null })
  mrp?: number;

  // Return tracking
  @Prop({ type: Number, default: 0 })
  totalReturnedQuantity?: number;

  @Prop({ type: String, required: true })
  blockchainId: string;

  @Prop({ type: String, required: true })
  genesisHash: string;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);

// Add indexes for common queries
BatchSchema.index({ batchID: 1 });
BatchSchema.index({ gtin: 1 });
BatchSchema.index({ lotNumber: 1 });
BatchSchema.index({ manufacturerGLN: 1 });
BatchSchema.index({ currentOwnerGLN: 1 });
BatchSchema.index({ status: 1 });
BatchSchema.index({ expiryDate: 1 });
BatchSchema.index({ sector: 1 });
BatchSchema.index({ blockchainId: 1 });
BatchSchema.index({ createdAt: -1 });