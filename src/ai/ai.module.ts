// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController, RecommendationsController } from './ai.controller'; // 👈 นำเข้าตัวควบคุมตัวใหม่
import { Student, StudentSchema } from '../students/schemas/student.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }])
  ],
  controllers: [AiController, RecommendationsController], // 👈 ใส่เพิ่มลงในอาเรย์นี้
  providers: [AiService],
})
export class AiModule {}