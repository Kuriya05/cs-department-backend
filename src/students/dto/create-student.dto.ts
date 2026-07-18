import { IsString, IsNumber, IsEmail, IsEnum, IsArray, Min, Max, IsOptional } from 'class-validator';
import { RiskLevel, StudentStatus } from '../schemas/student.schema';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  studentId: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(1)
  @Max(8)
  year: number;

  @IsNumber()
  @Min(0.00)
  @Max(4.00)
  gpa: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  attendanceRate: number;

  @IsNumber()
  @Min(0)
  droppedCourses: number;

  @IsEnum(RiskLevel)
  risk: string;

  @IsEnum(StudentStatus)
  status: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsArray()
  @IsString({ each: true })
  courses: string[];

  @IsArray()
  @IsString({ each: true })
  lecturers: string[];
}