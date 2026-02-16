import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from './base-entity.schema';
import { Sector, ERPType, UserRole } from '../../../types';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User extends BaseEntity {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string; // Hashed password

  @Prop({ type: String, required: true, unique: true })
  gln: string; // Global Location Number

  @Prop({ type: String, required: true })
  orgName: string;

  @Prop({ type: String, required: true, default: 'IN' }) // Default to India
  country: string;

  @Prop({ type: String, enum: Sector, required: true })
  sector: Sector;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: String, required: true })
  positionLabel: string;

  @Prop({ type: String, enum: ERPType, required: true })
  erpType: ERPType;

  @Prop({ type: String, enum: ['CONNECTED', 'DISCONNECTED', 'PENDING'], default: 'PENDING' })
  erpStatus: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';

  @Prop({ type: [String], default: [] })
  subCategories: string[];

  @Prop({ type: String, default: '' })
  phone?: string;

  @Prop({ type: String, default: '' })
  address?: string;

  @Prop({ type: Boolean, default: true })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  refreshToken?: string;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for common queries
UserSchema.index({ email: 1 });
UserSchema.index({ gln: 1 });
UserSchema.index({ orgName: 1 });
UserSchema.index({ sector: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ country: 1 });
UserSchema.index({ erpStatus: 1 });