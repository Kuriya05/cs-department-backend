import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [
    // ลงทะเบียน Schema วิชาเรียนให้เซิร์ฟเวอร์ NestJS รู้จักจริง
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema }
    ])
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // เปิดให้ฝั่งแดชบอร์ดดึงไปคำนวณสถิติต่อได้ด้วย
})
export class CoursesModule {}