import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentDocument = Student & Document;

// 🎯 ประกาศ Enums ให้ฝั่ง DTO เรียกใช้งานได้ถูกต้อง
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  NONE = 'None',
}

export enum StudentStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  GRADUATED = 'Graduated',
}

@Schema({ timestamps: true })
export class Student {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  studentId: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, min: 1, max: 8 })
  year: number;

  @Prop({ required: true, min: 0, max: 4 })
  gpa: number;

  @Prop({ required: true, min: 0, max: 100 })
  attendanceRate: number;

  @Prop({ required: true, min: 0 })
  droppedCourses: number;

  @Prop({ required: true, enum: RiskLevel, default: RiskLevel.NONE })
  risk: string;

  @Prop({ required: true, enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: string;

  @Prop({ default: 'Computer Science' })
  major: string;

  @Prop({ type: [String], default: [] })
  courses: string[];

  @Prop({ type: [String], default: [] })
  lecturers: string[];
}

export const StudentSchema = SchemaFactory.createForClass(Student);