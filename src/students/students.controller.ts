// src/students/students.controller.ts
import { Controller, Get, Post, Body, Query, Patch, Param, Delete } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students') // จะกลายเป็น /api/v1/students อัตโนมัติเมื่อรวมกับ Global Prefix
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ==========================================
  // 📌 1. STATIC PATHS (เอาเราท์ที่เป็นคำตายตัวไว้บนสุดเสมอ)
  // ==========================================

  // 📊 เราท์สถิติแดชบอร์ดระดับสูง (ยิงมาที่ /api/v1/students/dashboard/analytics)
  // 💡 ย้ายมาไว้ด้านบนสุด เพื่อป้องกันไม่ให้ Router ของ Express/NestJS สับสนกับเราท์อื่น
  @Get('dashboard/analytics')
  async getAnalytics() {
    return this.studentsService.getRiskSummaryStats();
  }

  // ⚡ เพิ่มเราท์สำหรับรับคำสั่ง Seed จากหน้าบ้านโดยตรง
  @Post('seed')
  async seedData(@Body() body: { data: any[] }) {
    return this.studentsService.seedBulk(body.data);
  }

  // ==========================================
  // 📌 2. GENERAL & DYNAMIC PATHS (พวกเราท์ทั่วไปและพวกที่มี Parameter)
  // ==========================================

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 5,
    @Query('search') search = '',
    @Query('risk') risk?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
  ) {
    return this.studentsService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      risk,
      year: year ? Number(year) : undefined,
      status,
    });
  }

  // 💡 เอาเราท์ที่มี Dynamic Parameter (:idOrStudentId) ไว้ล่างสุดของกลุ่ม HTTP Method เดียวกัน
  @Get(':idOrStudentId')
  async findOne(@Param('idOrStudentId') idOrStudentId: string) {
    return this.studentsService.findOne(idOrStudentId);
  }

  @Patch(':idOrStudentId')
  async update(@Param('idOrStudentId') idOrStudentId: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(idOrStudentId, updateStudentDto);
  }

  @Delete(':idOrStudentId')
  async remove(@Param('idOrStudentId') idOrStudentId: string) {
    return this.studentsService.remove(idOrStudentId);
  }
}