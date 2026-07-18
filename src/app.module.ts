import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi'; // 👈 อิมพอร์ต Joi สำหรับทำตัวตรวจสอบความถูกต้องของไฟล์ .env

import { AppController } from './app.controller'; 
import { AppService } from './app.service';         

// 📦 โมดูลระบบภายในทั้งหมดของแอปพลิเคชัน
import { StudentsModule } from './students/students.module';
import { LecturersModule } from './lecturers/lecturers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CoursesModule } from './courses/courses.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ⚙️ 1. โหลดไฟล์ .env พร้อมระบบ Validation ป้องกันระบบล่มเงียบ (Silent Failures)
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
      // 🛡️ ป้องกันระบบรันผ่านถ้าตั้งค่าหลังบ้านไม่ครบ
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        MONGO_URI: Joi.string().required().messages({
          'any.required': '❌ เกิดข้อผิดพลาด: กรุณาระบุ MONGO_URI ในไฟล์ .env ก่อนเริ่มระบบ',
        }),
        JWT_SECRET: Joi.string().required().messages({
          'any.required': '❌ เกิดข้อผิดพลาด: กรุณาระบุ JWT_SECRET สำหรับระบบ AuthModule ในไฟล์ .env',
        }),
        // คุณสามารถเพิ่มการตรวจจับ API Key ของ AiModule ได้ตรงนี้ เช่น:
        // OPENAI_API_KEY: Joi.string().optional(),
      }),
    }),

    // 🗄️ 2. เชื่อมต่อ MongoDB แบบ Async มีเสถียรภาพสูง
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return {
          uri: uri,
          // 💡 คุณสามารถเปิดตัวเลือกเสริมสำหรับการปรับแต่ง Connection Pool ของ MongoDB ได้ที่นี่ในอนาคต
          // retryAttempts: 5,
          // retryDelay: 3000,
        };
      },
    }),

    // 🚀 3. รันระบบนิเวศของโมดูลย่อยทั้งหมด
    StudentsModule,
    LecturersModule,
    DashboardModule,
    CoursesModule,
    ReportsModule,
    AiModule,
    ChatModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController], 
  providers: [AppService],      
})
export class AppModule {}