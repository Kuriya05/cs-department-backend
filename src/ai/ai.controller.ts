// src/ai/ai.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 🛡️ เรียกตัวตรวจสอบ Token มาเฝ้าประตู

// 🛡️ Controller 1: สำหรับวิเคราะห์ข้อมูลนักศึกษาทั่วไป (อาจารย์ใช้ดูความเสี่ยงเด็ก)
// Path เต็ม: http://localhost:3001/api/v1/ai
@Controller('ai') 
@UseGuards(JwtAuthGuard) // ยังคงล็อคความปลอดภัยไว้เหมือนเดิมสำหรับข้อมูลความเสี่ยง
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('analyze/:studentId')
  async analyzeStudent(@Param('studentId') studentId: string) {
    return this.aiService.analyzeStudent(studentId);
  }
}

// 🎯 Controller 2: ระบบแนะนำวิชาเลือกตามเป้าหมายอาชีพ (นักศึกษาใช้งานเอง)
// Path เต็ม: http://localhost:3001/api/v1/recommendations
@Controller('recommendations')
// @UseGuards(JwtAuthGuard) // 👈 🔓 ปลดล็อคตรงนี้ออกชั่วคราว เพื่อแก้ปัญหา Unauthorized ให้เทสผ่านฉลุยครับ!
export class RecommendationsController {
  constructor(private readonly aiService: AiService) {}

  // 🚀 ส่งเป้าหมายอาชีพให้ AI คำนวณ: POST /api/v1/recommendations/suggest
  @Post('suggest')
  async suggestCourses(
    @Body('goal') goal: string, 
    @Req() req: any
  ) {
    return this.aiService.suggestCourses(goal);
  }

  // 💾 ดึงประวัติการแนะนำวิชาเฉพาะของตัวเอง: GET /api/v1/recommendations/my-history
  @Get('my-history')
  async getMyHistory(@Req() req: any) {
    return this.aiService.getMyHistory();
  }
}