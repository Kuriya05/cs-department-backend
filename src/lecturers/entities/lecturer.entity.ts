import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LecturerDocument = Lecturer & Document;

@Schema({ timestamps: true })
export class Lecturer {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: [String], required: true }) // เก็บ Array ของ string สำหรับวิชาที่สอน
  subjects!: string[];

  @Prop({ required: true, default: 0 })
  studentsCount!: number;

  @Prop({ required: true, default: 0 })
  workload!: number;
}

export const LecturerSchema = SchemaFactory.createForClass(Lecturer);