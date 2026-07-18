// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
// 🟢 [แก้ไขแล้ว]: เปลี่ยนจาก import express เฉย ๆ เป็น import * as express
import * as express from 'express'; 

async function bootstrap() {
  // 🟢 กลับมาใช้การสร้างแอปแบบปกติ ไม่ต้องมี ExpressAdapter ครอบแล้ว
  const app = await NestFactory.create(AppModule);
  
  const logger = new Logger('Bootstrap'); 
  const configService = app.get(ConfigService);

  // 🛡️ 1. ติดตั้ง Helmet Security Headers
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
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 📦 2. จำกัดขนาด JSON Payload
  // (ตอนนี้โค้ดบรรทัดนี้จะทำงานได้ปกติ ไม่ติด Error แล้วครับ)
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 🌐 3. ตั้งค่า Prefix ให้ API
  app.setGlobalPrefix('api/v1');

  // 🟢 4. หน้าต้อนรับ Health Check เก๋ ๆ (สำหรับเช็กหน้าแรกบน Render)
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: '🚀 CS Department MIS API is running smoothly on Render!',
      environment: 'Production (Render Web Service)',
      documentation: '/docs',
      timestamp: new Date().toISOString()
    });
  });

  // 🛡️ 5. เปิดใช้งาน DTO Validation ระดับ Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  // 🌍 6. ระบบ CORS
  const rawFrontendUrls = configService.get<string>('FRONTEND_URL') || '';
  let allowedOrigins: (string | RegExp)[] = ['http://localhost:3000', 'http://127.0.0.1:3000'];

  if (rawFrontendUrls) {
    const prodOrigins = rawFrontendUrls.split(',').map(url => url.trim());
    allowedOrigins = [...allowedOrigins, ...prodOrigins];
  }

  app.enableCors({
    origin: allowedOrigins, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    credentials: true, 
  });

  // 📚 7. ระบบคู่มือ API (Swagger UI) 
  const config = new DocumentBuilder()
    .setTitle('CS Department MIS API')
    .setDescription('ระบบสารสนเทศภาควิชา')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'JWT-auth', 
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  }); 

  app.enableShutdownHooks();

  // 🚀 8. รันเซิร์ฟเวอร์บนพอร์ตที่ Render กำหนดให้
  // (สำคัญมาก: บน Render ต้องใส่ '0.0.0.0' เพื่อให้ภายนอกเชื่อมต่อเข้ามาได้)
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`==========================================================`);
  logger.log(`🚀 API Server is running on port: ${port}`);
  logger.log(`🌐 Health Check URL: http://localhost:${port}/`);
  logger.log(`==========================================================`);
}
bootstrap();