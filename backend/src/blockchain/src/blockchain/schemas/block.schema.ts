import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Block & Document;

@Schema({ timestamps: true })
export class Block {
  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  transactions: any[];

  @Prop({ required: true })
  previousHash: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  merkleRoot: string;

  @Prop({ required: true, default: 0 })
  nonce: number;

  @Prop()
  validator?: string;

  @Prop()
  signature?: string;
}

export const BlockSchema = SchemaFactory.createForClass(Block);