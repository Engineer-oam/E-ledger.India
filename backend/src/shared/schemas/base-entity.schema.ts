import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BaseEntityDocument = BaseEntity & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class BaseEntity {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, default: () => new Types.ObjectId().toString() })
  uuid: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['CREATED', 'UPDATED', 'DELETED'], default: 'CREATED' })
  status: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  updatedBy?: string;
}

export const BaseSchema = SchemaFactory.createForClass(BaseEntity);

// Add indexes for common queries
BaseSchema.index({ uuid: 1 });
BaseSchema.index({ createdAt: -1 });
BaseSchema.index({ updatedAt: -1 });
BaseSchema.index({ isActive: 1 });