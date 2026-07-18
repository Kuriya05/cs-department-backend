import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LecturerDocument = Lecturer & Document;

// 🎯 กำหนดตำแหน่งทางวิชาการ (Enum)
export enum AcademicTitle {
  LECTURER = 'อาจารย์',
  DR = 'ดร.',
  ASST_PROF = 'ผศ.',
  ASST_PROF_DR = 'ผศ.ดร.',
  ASSOC_PROF = 'รศ.',
  ASSOC_PROF_DR = 'รศ.ดร.',
  PROF = 'ศ.',
  PROF_DR = 'ศ.ดร.',
}

// 🎯 定กำหนดสถานะของอาจารย์
export enum LecturerStatus {
  ACTIVE = 'Active',         // ปฏิบัติงานปกติ
  ON_LEAVE = 'On Leave',     // ลาศึกษาต่อ/วิจัย
  RESIGNED = 'Resigned',     // ลาออก/เกษียณ
}

@Schema({ 
  timestamps: true, // ระบบสร้าง createdAt และ updatedAt ให้อัตโนมัติ
  collection: 'lecturers' // ล็อกชื่อ Collection ใน MongoDB
})
export class Lecturer {
  @Prop({ 
    required: true, 
    unique: true, 
    trim: true, 
    index: true // ⚡ Index รหัสประจำตัวอาจารย์
  })
  lecturerId: string; 

  @Prop({ 
    required: true, 
    enum: AcademicTitle, 
    default: AcademicTitle.LECTURER,
    index: true // ⚡ เพิ่ม Index เพราะถูกใช้กรองบ่อยในหน้า FindAll
  })
  academicTitle: string; 

  @Prop({ required: true, trim: true, index: true })
  name: string; // ชื่อ-นามสกุล

  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true // ⚡ เพิ่ม Index เพื่อความเร็วในการตรวจสอบอีเมลซ้ำตอนสมัคร/อัปเดต
  })
  email: string;

  @Prop({ required: true, trim: true, default: 'Computer Science', index: true })
  department: string; 

  @Prop({ type: [String], default: [] })
  subjects: string[]; // 💡 เก็บเป็นอาร์เรย์รหัสวิชา เช่น ['CS-401', 'CS-101']

  @Prop({ required: true, min: 0, default: 0 })
  studentsCount: number; // 💡 เปลี่ยนมาใช้ studentsCount ตามโครงสร้างคุณ

  @Prop({ required: true, min: 0, max: 100, default: 0 }) // 💡 แนะนำขยาย Max เป็น 100 หากคิดเปอร์เซ็นต์ภาระงาน
  workload: number; 

  @Prop({ 
    default: 'Optimal workload allocation.',
    trim: true 
  })
  recommend: string; // 👈 🟢 [เพิ่มใหม่] เพื่อรองรับคำแนะนำวิเคราะห์ภาระงานอัตโนมัติจากฝั่ง Service

  @Prop({ 
    required: true, 
    enum: LecturerStatus, 
    default: LecturerStatus.ACTIVE,
    index: true // ⚡ เพิ่ม Index เพื่อรองรับระบบคัดกรองสถานะอาจารย์
  })
  status: string; 
}

export const LecturerSchema = SchemaFactory.createForClass(Lecturer);

// 🛠️ Compound Index เร่งความเร็วการดึงข้อมูลแดชบอร์ด
LecturerSchema.index({ workload: -1, status: 1 });