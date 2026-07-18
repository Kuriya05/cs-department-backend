// backend/src/chat/chat.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat') // 👈 ทุก Endpoint ในนี้จะขึ้นต้นด้วย http://localhost:3001/chat
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 💬 [Feature 5] AI Chatbot สำหรับสาขา (ดึงสถิติ/ข้อมูลจาก MongoDB)
   * ตัวอย่างการเรียกใช้งาน: POST http://localhost:3001/chat
   * Body: { "message": "ปี 2569 วิชา AI มีนักศึกษาลงทะเบียนกี่คน" }
   */
  @Post()
  async chat(@Body('message') message: string) {
    return this.chatService.handleChatMessage(message);
  }

  /**
   * 🔴 [Feature 2] AI Predict นักศึกษาที่มีความเสี่ยง (ส่งไปประมวลผลที่ Python)
   * ตัวอย่างการเรียกใช้งาน: POST http://localhost:3001/chat/predict-risk
   * Body: { "gpa": 2.1, "attendanceRate": 75, "droppedCourses": 1 }
   */
  @Post('predict-risk')
  async predictRisk(
    @Body() body: { gpa: number; attendanceRate: number; droppedCourses: number },
  ) {
    return this.chatService.predictStudentRisk(
      body.gpa,
      body.attendanceRate,
      body.droppedCourses,
    );
  }

  /**
   * 💡 [Feature 3] AI Course Recommendation (ส่งไปจัดคู่สายอาชีพที่ Python)
   * ตัวอย่างการเรียกใช้งาน: POST http://localhost:3001/chat/recommend-courses
   * Body: { "careerGoal": "Data Scientist" }
   */
  @Post('recommend-courses')
  async recommendCourses(@Body() body: { careerGoal: string }) {
    return this.chatService.getCourseRecommendation(body.careerGoal);
  }
}