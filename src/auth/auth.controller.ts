// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Path หลัก: http://localhost:3001/api/v1/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // 1. เช็คว่ามีคนนี้อยู่จริงและรหัสถูกไหม
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Username หรือ Password ไม่ถูกต้อง');
    }
    
    // 2. ถ้าถูก ให้ออก Token คืนไป
    return this.authService.login(user);
  }

  // 🛠️ อัปเดต Endpoint สำหรับสมัครสมาชิก (Register) ให้ส่งค่า Role ไปด้วย
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // ส่ง Status 201 กลับไปเมื่อสร้างบัญชีสำเร็จ
  async register(@Body() registerDto: any) { // เปลี่ยนเป็น any เพื่อเปิดรับฟิลด์ role จาก Postman
    // ส่งข้อมูลทั้ง username, password และ role ไปให้ฝั่ง Service ทำงานต่อ
    return this.authService.register(
      registerDto.username, 
      registerDto.password, 
      registerDto.role
    );
  }
}