import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseDocument = Course & Document;

// 🎯 กำหนดหมวดหมู่วิชา (Enum) เพื่อช่วย AI ในการจัดกลุ่มแนะนำวิชาเรียนตามสายอาชีพ
export enum CourseCategory {
  CORE = 'Core',                         // วิชาแกนบังคับ
  ELECTIVE = 'Elective',                 // วิชาเลือกเสรี
  AI = 'AI',                             // สายปัญญาประดิษฐ์
  DATA_SCIENCE = 'Data Science',         // สายวิทยาการข้อมูล
  SOFTWARE_ENG = 'Software Engineering', // สายวิศวกรรมซอฟต์แวร์
  NETWORK = 'Network & Security',        // สายเครือข่ายและความปลอดภัย
}

@Schema({ 
  timestamps: true, // ระบบจะสร้าง createdAt และ updatedAt ให้อัตโนมัติ
  collection: 'courses' 
})
export class Course {
  @Prop({ 
    required: true, 
    unique: true, 
    trim: true, 
    uppercase: true, // 🧼 บังคับเป็นตัวพิมพ์ใหญ่เสมอ เช่น cs-401 -> CS-401
    index: true      // ⚡ ทำ Index ให้ค้นหารหัสไวขึ้น
  })
  courseCode: string;

  @Prop({ required: true, trim: true, index: true })
  courseName: string;

  @Prop({ trim: true, default: '' })
  description: string; // 💡 คำอธิบายรายวิชา (สำคัญมากให้ AI ดึงคีย์เวิร์ดไปจับคู่กับความชอบของนักศึกษา)

  @Prop({ 
    required: true, 
    enum: CourseCategory, 
    default: CourseCategory.CORE,
    index: true
  })
  category: string; // 💡 หมวดหมู่รายวิชา

  @Prop({ required: true, trim: true, index: true })
  semester: string; // 💡 ภาคเรียน เช่น "1/2569" หรือ "2569" (ทำ Index ไว้ให้บอทแชทค้นหาได้ทันที)

  @Prop({ required: true, min: 1, max: 6, default: 3 })
  credit: number; // 💡 จำกัดหน่วยกิตไม่ให้เกิดข้อผิดพลาด (1-6 หน่วยกิต)

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  averageScore: number; // 💡 คะแนนเฉลี่ยสะสมของรายวิชา (0-100)

  @Prop({ required: true, trim: true })
  teacher: string; // 💡 ชื่ออาจารย์ผู้สอน

  @Prop({ type: [String], default: [] })
  prerequisites: string[]; // 💡 รายวิชาบังคับก่อนหน้า (Pre-req) เช่น ต้องผ่าน [CS-101] ก่อน

  @Prop({ required: true, default: 30 })
  maxCapacity: number; // 💡 จำนวนนักศึกษาที่รับได้สูงสุด

  @Prop({ required: true, default: 0 })
  enrolledStudents: number; // 💡 จำนวนนักศึกษาที่ลงทะเบียนปัจจุบัน
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// 🛠️ คีย์ลัดเร่งความเร็วระบบ (Compound Index)
// รองรับบอทแชท (Chatbot) ที่ชอบค้นหาด้วยเงื่อนไข "ชื่อวิชา + ภาคเรียน" พร้อมกัน
CourseSchema.index({ courseName: 1, semester: 1 });
CourseSchema.index({ courseCode: 1, semester: 1 });