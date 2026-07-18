// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express'; // 🆕 ดึงมาเพื่อแปลงระบบให้รองรับ Serverless
import helmet from 'helmet';
import express from 'express'; // 🟢 [แก้ไขจุดพัง]: เปลี่ยนเป็น Default Import เพื่อให้ Vercel เรียกใช้งานเป็นฟังก์ชันได้

// 🆕 1. สร้าง Instance ของ Express รอไว้ข้างนอก เพื่อส่งต่อให้ Vercel เรียกใช้งาน
const server = express();

async function bootstrap() {
  // 🆕 2. เปลี่ยนมาใช้ ExpressAdapter ครอบตัวแอป NestJS เอาไว้
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  const logger = new Logger('Bootstrap'); 
  const configService = app.get(ConfigService);

  // 🛡️ 1. ติดตั้ง Helmet Security Headers (ปรับ CSP และปลดล็อค CORP ให้แชร์ข้อมูลข้ามไซต์ได้)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `'unsafe-inline'`], 
        },
      },
      // 🟢 ปลดล็อกเพื่อให้หน้าบ้าน Next.js สามารถดึง API ข้าม Domain ได้โดยไม่โดนเบราว์เซอร์บล็อก
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 📦 2. เพิ่มเกราะป้องกัน DoS & รองรับระบบ AI/Chat ด้วยการจำกัดขนาด JSON Payload
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 🌐 3. ตั้งค่า Prefix ให้ API
  app.setGlobalPrefix('api/v1');

  // 🛡️ 4. เปิดใช้งาน DTO Validation ระดับ Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  // 🌍 5. ปรับปรุงระบบ CORS ให้ปลอดภัย และยืดหยุ่น (รองรับ IPv4/IPv6 Localhost Mismatch)
  const rawFrontendUrls = configService.get<string>('FRONTEND_URL') || '';
  let allowedOrigins: string[] = [];

  if (rawFrontendUrls) {
    allowedOrigins = rawFrontendUrls.split(',').map(url => url.trim());
  } else {
    // 🟢 ถ้าไม่ได้ระบุใน .env ให้เปิดทั้ง localhost และ 127.0.0.1 ครอบคลุมทุกสภาวะ Network ในเครื่อง Dev
    allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  app.enableCors({
    origin: allowedOrigins, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 🟢 เพิ่ม OPTIONS ป้องกัน Preflight Request ตกหล่น
    credentials: true, 
  });

  // 📚 6. ระบบคู่มือ API (Swagger UI) 
  const config = new DocumentBuilder()
    .setTitle('CS Department MIS API')
    .setDescription('ระบบสารสนเทศภาควิชา - ติดตั้งระบบรักษาความปลอดภัย JWT, Excel Reports และสมองกล AI Analytics')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'วาง access_token ที่ได้จากหน้า Login เพื่อเข้าใช้งาน API ส่วนที่ถูกล็อคไว้',
        in: 'header',
      },
      'JWT-auth', 
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
    },
  }); 

  // 🛑 7. เปิด Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // 🚀 8. รันเซิร์ฟเวอร์ (แยกเงื่อนไขรันสลับระหว่างเครื่องเรา กับ Cloud บน Vercel)
  if (process.env.VERCEL) {
    // ☁️ ถ้าทำงานอยู่บน Vercel ให้ทำการ Init ตัวระบบเงียบ ๆ (Vercel จะแจกจ่ายพอร์ตและรัน Serverless ให้เอง)
    await app.init();
  } else {
    // 💻 ถ้ารันบนเครื่องตัวเอง (Local Dev) ให้เปิด Listen พอร์ตตามปกติ
    const port = parseInt(configService.get<string>('PORT') || '3001', 10);
    await app.listen(port);
    
    // พ่น Log ตรวจสอบสถานะการเชื่อมต่อ
    logger.log(`==========================================================`);
    logger.log(`🚀 API Server Status    : ACTIVE (Local Dev Mode)`);
    logger.log(`🌐 Base API URL         : http://localhost:${port}/api/v1`);
    logger.log(`📚 Swagger Document UI  : http://localhost:${port}/docs`);
    logger.log(`🌍 Allowed Frontend CORS: ${allowedOrigins.join(', ')}`);
    logger.log(`==========================================================`);
  }
}
bootstrap();

// 🆕 3. ส่งออก (Export) ตัวเซิร์ฟเวอร์เพื่อให้ Vercel ตื่นขึ้นมาเรียกใช้งานในรูปแบบ Serverless Function
export default server;