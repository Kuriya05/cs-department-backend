import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
// 🔌 นำเข้า Schema ของนักศึกษาและรายวิชาตามโครงสร้างโฟลเดอร์ของคุณ
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';

@Module({
  imports: [
    // 🔥 ลงทะเบียน Model ให้ ChatModule สามารถเรียกใช้งานได้
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}