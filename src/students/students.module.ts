import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from './schemas/student.schema'; // 👈 เช็ก path ให้ตรงกับที่อยู่จริงนะครับ

@Module({
  imports: [
    // 🔌 ผูก Schema ของนักศึกษาเข้ากับระบบ Mongoose ของโมดูลนี้
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema }
    ])
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService], // เปิดให้ DashboardModule หรือโมดูลอื่นสามารถดึงไปใช้ได้ด้วย
})
export class StudentsModule {}