// src/dashboard/dashboard.controller.ts
import { 
  Controller, 
  Get, 
  Query, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

// 🎯 แก้ไข: ลบคำว่า api/ ออก ให้เหลือแค่ 'dashboard' 
// เพื่อให้ URL ออกมาเป็น /api/v1/dashboard/stats ตรงตามที่หน้าบ้านเรียกใช้งาน
@Controller('dashboard') 
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * ⚡ 1. GET /api/v1/dashboard/stats
   * Endpoint หลักที่หน้าบ้าน Next.js ยิงมาขอสถิติแบบ Real-time
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getLiveStats() {
    // เรียกให้ Service ไปนับข้อมูลจริงจาก MongoDB มาตอบกลับ
    return this.dashboardService.getQuickStats();
  }

  /**
   * 📊 2. GET /api/v1/dashboard
   * รองรับการกรองข้อมูลตามปีการศึกษาและภาคเรียน (สำหรับฟีเจอร์ขั้นสูงในอนาคต)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  getDashboardOverview(
    @Query('year') year?: string,
    @Query('semester') semester?: string,
  ) {
    const filterOptions = {
      year: year ? parseInt(year, 10) : undefined,
      semester: semester || undefined,
    };
    return this.dashboardService.getDashboardData(filterOptions);
  }
}