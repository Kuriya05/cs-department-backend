import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @IsString()
  @IsNotEmpty()
  courseName: string;

  @IsString()
  @IsNotEmpty()
  semester: string;

  @IsNumber()
  @IsNotEmpty()
  credit: number;

  @IsNumber()
  averageScore: number;

  @IsString()
  @IsNotEmpty()
  teacher: string;
}