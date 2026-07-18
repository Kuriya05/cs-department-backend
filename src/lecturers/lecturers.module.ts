import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { Lecturer, LecturerSchema } from './schemas/lecturer.schema';

@Module({
  imports: [
    // 🔌 ลงทะเบียนโมเดลอาจารย์เพื่อทำ Dependency Injection เข้าสู่ Service
    MongooseModule.forFeature([
      { name: Lecturer.name, schema: LecturerSchema }
    ])
  ],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService], // 🔓 เปิดให้โมดูลอื่นดึง Service นี้ไป Reuse ใช้ซ้ำได้โดยไม่ต้องเชื่อมต่อ DB ใหม่
})
export class LecturersModule {}