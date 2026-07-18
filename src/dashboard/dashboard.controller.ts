// src/dashboard/dashboard.controller.ts
import { 
  Controller, 
  Get, 
  Query, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard') // 🛠️ ปรับให้ตรงกับหน้าบ้าน: http://localhost:3001/api/dashboard
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * ⚡ 1. GET /api/dashboard/stats
   * Endpoint หลักที่หน้าบ้าน Next.js ยิงมาขอสถิติแบบ Real-time
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getLiveStats() {
    // เรียกให้ Service ไปนับข้อมูลจริงจาก MongoDB มาตอบกลับ
    return this.dashboardService.getQuickStats();
  }

  /**
   * 📊 2. GET /api/dashboard
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