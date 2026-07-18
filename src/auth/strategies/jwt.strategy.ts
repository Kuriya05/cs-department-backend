// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // บอกยามให้ไปแกะ Token มาจาก Header ตรงคำว่า Bearer
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // ถ้าบัตรหมดอายุ ให้เด้งออกทันที
      // กุญแจลับสำหรับไขบัตร ต้องตรงกับตอนปั๊มบัตร
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key', 
    });
  }

  // ถ้า Token ถูกต้องและยังไม่หมดอายุ ฟังก์ชันนี้จะทำงาน
  async validate(payload: any) {
    // ข้อมูลนี้จะถูกส่งไปแปะไว้ที่ Request (req.user) ให้เราเรียกใช้ต่อได้
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}