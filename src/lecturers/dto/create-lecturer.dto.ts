import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  Min,
  Max,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer'; // 👈 เพิ่มเข้ามาเพื่อช่วยแปลงประเภทข้อมูลอย่างปลอดภัย

// นำเข้า Enum จาก Schema เพื่อให้ตัวเลือกตรงกันเป๊ะ 100%
import { AcademicTitle, LecturerStatus } from '../schemas/lecturer.schema'; 

export class CreateLecturerDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสประจำตัวบุคลากร (lecturerId)' })
  lecturerId!: string; // ⚡ บังคับว่าต้องมีค่า

  @IsOptional()
  @IsEnum(AcademicTitle, { message: 'ตำแหน่งทางวิชาการไม่ถูกต้อง (เช่น อาจารย์, ผศ., รศ.)' })
  academicTitle?: string; // ⚡ ถ้าไม่ส่งมา ฐานข้อมูลจะใช้ค่า Default เป็น 'อาจารย์'

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุชื่อ-นามสกุลอาจารย์' })
  name!: string;

  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณาระบุอีเมล' })
  email!: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray({ message: 'รายวิชาต้องส่งมาเป็นรูปแบบ Array' })
  @IsString({ each: true, message: 'รหัสวิชาใน Array ต้องเป็นข้อความ (String) เท่านั้น' })
  @IsOptional() // ⚡ ให้เป็น Optional เพราะช่วงแรกอาจจะยังไม่จัดตารางสอน
  subjects?: string[];

  @IsNumber({}, { message: 'จำนวนนักศึกษาต้องเป็นตัวเลขเท่านั้น' })
  @Min(0, { message: 'จำนวนนักศึกษาติดลบไม่ได้' })
  @Type(() => Number) // 👈 บังคับแปลงข้อความเป็นตัวเลข ป้องกันหน้าบ้านส่งแบบ String มาติดบั๊ก
  @IsOptional()
  studentsCount?: number;

  @IsNumber({}, { message: 'ภาระงานสอนต้องเป็นตัวเลขเท่านั้น' })
  @Min(0, { message: 'ภาระงานสอนติดลบไม่ได้' })
  @Max(100, { message: 'ภาระงานสอนเกินขีดจำกัด (สูงสุด 100)' }) // ⚡ ปรับเป็น 100 เพื่อให้รองรับค่าเปอร์เซ็นต์จาก Service Engine
  @Type(() => Number) // 👈 บังคับแปลงข้อความเป็นตัวเลข ป้องกัน Error
  @IsOptional()
  workload?: number;

  @IsOptional()
  @IsEnum(LecturerStatus, { message: 'สถานะไม่ถูกต้อง (ต้องเป็น Active, On Leave, Resigned)' })
  status?: string;
}