// src/courses/courses.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Controller('courses') // Base Path: http://localhost:3001/courses
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * ➕ 1. เพิ่มรายวิชาใหม่เข้าระบบ
   * POST /courses
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  /**
   * 📖 2. ดึงข้อมูลวิชาแบบแบ่งหน้า (Pagination & Filters)
   * GET /courses
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('semester') semester?: string,
  ) {
    const paginationOptions = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || '',
      category: category || undefined,
      semester: semester || undefined,
    };

    return this.coursesService.findAll(paginationOptions);
  }

  /**
   * 📊 3. ดึงข้อมูลสถิติรายวิชาสำหรับหน้า Dashboard
   * GET /courses/analytics/summary
   */
  @Get('analytics/summary')
  getCourseAnalyticsSummary() {
    return this.coursesService.getCourseSummaryStats();
  }

  /**
   * 📈 3.5 ดึงข้อมูลวิเคราะห์หลักสูตรเชิงลึก (AI Academic Analytics)
   * GET /courses/academic
   */
  @Get('academic')
  getAcademicAnalytics() {
    return this.coursesService.getAcademicAnalytics();
  }

  /**
   * 🛒 3.8 ดึงรายวิชาทั้งหมด (ไม่แบ่งหน้า) เพื่อให้นักศึกษาเลือกในฟอร์มลงทะเบียน
   * GET /courses/all/selection
   */
  @Get('all/selection')
  async findAllForSelection() {
    // ดึงข้อมูลทั้งหมดจากฐานข้อมูลโดยตรงเพื่อไปแสดงในกล่อง Checkbox ฝั่ง Frontend
    return await this.coursesService.findAllWithoutPagination();
  }

  /**
   * 📇 4. ค้นหารายวิชาแบบเจาะจงตามรหัสวิชา (1 รายวิชา)
   * GET /courses/:courseCode
   */
  @Get(':courseCode')
  findOne(@Param('courseCode') courseCode: string) {
    return this.coursesService.findOne(courseCode);
  }

  /**
   * ✏️ 5. อัปเดตข้อมูลรายวิชาตามรหัสวิชา
   * PATCH /courses/:courseCode
   */
  @Patch(':courseCode')
  update(
    @Param('courseCode') courseCode: string, 
    @Body() updateCourseDto: Partial<CreateCourseDto>
  ) {
    return this.coursesService.update(courseCode, updateCourseDto);
  }

  /**
   * 🗑️ 6. ลบข้อมูลรายวิชาออกจากระบบถาวร
   * DELETE /courses/:courseCode
   */
  @Delete(':courseCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('courseCode') courseCode: string) {
    return this.coursesService.remove(courseCode);
  }
}