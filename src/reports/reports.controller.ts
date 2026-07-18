// src/reports/reports.controller.ts
import { Controller, Get, Res, UseGuards, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 👈 เรียกตัวยามมาใช้งาน

@Controller('reports') // Base Path: http://localhost:3001/api/v1/reports
@UseGuards(JwtAuthGuard) // 🛡️ ล็อคประตู! ทุก API ใน Class นี้ต้องมี Token (Bearer) ถึงจะเข้าได้
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name); // 📋 ตัวเก็บบันทึก Log

  constructor(private readonly reportsService: ReportsService) {}

  // 📝 1. โหลด Excel นักศึกษา
  @Get('students/excel')
  async downloadStudentsExcel(@Res() res: Response) {
    this.logger.log('📥 กำลังดาวน์โหลดรายงานนักศึกษา...');
    const workbook = await this.reportsService.generateStudentsExcel();
    this.setResponseHeaders(res, 'students_report');
    await workbook.xlsx.write(res);
    res.end();
  }

  // 👨‍🏫 2. โหลด Excel อาจารย์
  @Get('lecturers/excel')
  async downloadLecturersExcel(@Res() res: Response) {
    this.logger.log('📥 กำลังดาวน์โหลดรายงานภาระงานอาจารย์...');
    const workbook = await this.reportsService.generateLecturersExcel();
    this.setResponseHeaders(res, 'lecturers_workload');
    await workbook.xlsx.write(res);
    res.end();
  }

  // 📚 3. โหลด Excel รายวิชา
  @Get('courses/excel')
  async downloadCoursesExcel(@Res() res: Response) {
    this.logger.log('📥 กำลังดาวน์โหลดรายงานรายวิชาทั้งหมด...');
    const workbook = await this.reportsService.generateCoursesExcel();
    this.setResponseHeaders(res, 'courses_list');
    await workbook.xlsx.write(res);
    res.end();
  }

  // 🏆 4. โหลด Excel แบบ ALL-IN-ONE (Master Report ที่แยก 3 หน้า)
  @Get('master/excel')
  async downloadMasterExcel(@Res() res: Response) {
    this.logger.log('🚀 ยอดมนุษย์กำลังดาวน์โหลด Master Report!');
    const workbook = await this.reportsService.generateMasterReport();
    this.setResponseHeaders(res, 'master_database_report');
    await workbook.xlsx.write(res);
    res.end();
  }

  // ⚙️ ตัวช่วยตั้งค่า Header เพื่อบอก Browser ให้ดาวน์โหลดไฟล์ (ลดการเขียนโค้ดซ้ำ)
  private setResponseHeaders(res: Response, baseFileName: string) {
    const date = new Date().toISOString().split('T')[0]; // สแตมป์วันที่ปัจจุบัน
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${baseFileName}_${date}.xlsx`, // ชื่อไฟล์แบบไดนามิก
    );
  }
}