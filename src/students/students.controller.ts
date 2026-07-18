import { Controller, Get, Post, Body, Query, Patch, Param, Delete } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students') // จะกลายเป็น /api/v1/students อัตโนมัติ
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // ⚡ เพิ่มเราท์สำหรับรับคำสั่ง Seed จากหน้าบ้านโดยตรง
  @Post('seed')
  async seedData(@Body() body: { data: any[] }) {
    return this.studentsService.seedBulk(body.data);
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

  // 📊 เราท์สถิติแดชบอร์ดระดับสูง (ยิงมาที่ /api/v1/students/dashboard/analytics)
  @Get('dashboard/analytics')
  async getAnalytics() {
    return this.studentsService.getRiskSummaryStats();
  }

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