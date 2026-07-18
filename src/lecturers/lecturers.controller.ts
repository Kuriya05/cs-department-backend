import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Logger, // 👈 เพิ่ม Logger สำหรับ Monitor ระบบหลังบ้าน
  ParseIntPipe, // 👈 ใช้แปลง String เป็น Number อัตโนมัติ
  DefaultValuePipe // 👈 ใช้กำหนดค่าเริ่มต้นให้ Query Parameter
} from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto'; // 👈 แนะนำให้แยกไฟล์ DTO สำหรับอัปเดต

@Controller('lecturers') // Base Path: http://localhost:3001/lecturers
export class LecturersController {
  // สร้าง Instance ของ Logger ประจำ Controller นี้
  private readonly logger = new Logger(LecturersController.name);

  constructor(private readonly lecturersService: LecturersService) {}

  /**
   * ➕ 1. POST: เพิ่มข้อมูลอาจารย์ใหม่
   * URL: POST /lecturers[cite: 7]
   */
  @Post()
  @HttpCode(HttpStatus.CREATED) // ส่ง HTTP 201[cite: 7]
  async create(@Body() createLecturerDto: CreateLecturerDto) {
    this.logger.log(`📥 Creating a new lecturer profile: ${createLecturerDto.name}`);
    return await this.lecturersService.create(createLecturerDto);
  }

  /**
   * 🔍 2. GET: ดึงข้อมูลอาจารย์ทั้งหมดพร้อมระบบคัดกรอง ค้นหา และแบ่งหน้า
   * URL: GET /lecturers?page=1&limit=10&search=สมชาย[cite: 7]
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,   // 👈 แปลงและใส่ Default เป็น 1 ทันที
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number, // 👈 แปลงและใส่ Default เป็น 10 ทันที
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('academicTitle') academicTitle?: string,
  ) {
    this.logger.log(`🔍 Fetching lecturers list. Page: ${page}, Limit: ${limit}, Search Query: "${search || ''}"`);
    
    // โค้ดสะอาดขึ้น ไม่ต้องเขียนครอบ parseInt เองแล้ว[cite: 7]
    return await this.lecturersService.findAll({
      page,
      limit,
      search: search || '',
      status,
      academicTitle,
    });
  }

  /**
   * 📊 3. GET: ดึงสถิติภาระงานสอนสำหรับหน้า Dashboard
   * URL: GET /lecturers/analytics/workload[cite: 7]
   */
  @Get('analytics/workload')
  async getWorkloadAnalytics() {
    this.logger.log('📊 Generating centralized academic workload metrics and analytics.');
    return await this.lecturersService.getWorkloadSummary();
  }

  /**
   * 📇 4. GET: ดึงข้อมูลอาจารย์รายคน (รองรับทั้ง Mongo _id และ lecturerId)
   * URL: GET /lecturers/:id[cite: 7]
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`📇 Retrieving data for lecturer ID: ${id}`);
    return await this.lecturersService.findOne(id);
  }

  /**
   * ✏️ 5. PATCH: อัปเดตข้อมูลอาจารย์แบบบางส่วน
   * URL: PATCH /lecturers/:id[cite: 7]
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateLecturerDto: UpdateLecturerDto // 👈 เปลี่ยนมาใช้โครงสร้างไฟล์ Update DTO โดยตรง[cite: 7]
  ) {
    this.logger.log(`✏️ Updating workload/profile attributes for lecturer ID: ${id}`);
    return await this.lecturersService.update(id, updateLecturerDto);
  }

  /**
   * ❌ 6. DELETE: ลบข้อมูลอาจารย์
   * URL: DELETE /lecturers/:id[cite: 7]
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // ส่ง HTTP 204 กลับไป[cite: 7]
  async remove(@Param('id') id: string) {
    this.logger.log(`❌ Request to delete lecturer record ID: ${id}`);
    return await this.lecturersService.remove(id);
  }
}