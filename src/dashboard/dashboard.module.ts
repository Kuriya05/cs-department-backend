// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Import Schemas ทั้ง 3 ตัวเข้ามา
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Lecturer, LecturerSchema } from '../lecturers/schemas/lecturer.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';

@Module({
  imports: [
    // 💡 ลงทะเบียนผูกมัด Schema ทั้ง 3 ตัวให้ Service หยิบไปใช้ได้
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Lecturer.name, schema: LecturerSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}