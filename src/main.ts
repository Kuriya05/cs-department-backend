// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = new Logger('Bootstrap'); 
  const configService = app.get(ConfigService);

  // 🛡️ 1. ติดตั้ง Helmet Security Headers (ปรับคอนฟิกให้เสถียรสำหรับ Swagger บน Production)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io', 'https://fastly.jsdelivr.net'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'https://fastly.jsdelivr.net'], 
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false, // 💡 สำคัญมากสำหรับ Render: ปิดเพื่อให้ Swagger UI โหลดโมดูลทำงานได้ปกติ ไม่เกิดปัญหาหน้าขาว
    }),
  );

  // 📦 2. จำกัดขนาด JSON Payload
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 🌐 3. ตั้งค่า Prefix ให้ API 
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'docs'],
  });

  // 🟢 4. หน้าต้อนรับ Health Check (Render จะใช้หน้านี้เช็กสถานะบ่อย ๆ เพื่อดูว่าแอปยังออนไลน์อยู่ไหม)
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: '🚀 CS Department MIS API is running smoothly on Render!',
      environment: process.env.NODE_ENV || 'Production',
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

  // 🌍 6. ระบบ CORS (ปรับปรุงให้รองรับทั้ง Localhost และ Production บน Render ได้อย่างเสถียร)
  const rawFrontendUrls = configService.get<string>('FRONTEND_URL') || '';
  const allowedOrigins: string[] = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];

  if (rawFrontendUrls && rawFrontendUrls !== '*') {
    const prodOrigins = rawFrontendUrls.split(',').map(url => url.trim());
    allowedOrigins.push(...prodOrigins);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // อนุญาตถ้า: ไม่มี origin (เช่น ยิงจาก Postman) หรือ origin อยู่ในรายการที่กำหนด หรือตั้งค่า FRONTEND_URL=* ไว้
      if (!origin || allowedOrigins.includes(origin) || rawFrontendUrls === '*') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    credentials: true, // เปิดไว้เพื่อให้ระบบสามารถรับส่ง Token / Authorization Header ข้ามโดเมนได้ปลอดภัย
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

  // 🚀 8. รันเซิร์ฟเวอร์
  const port = process.env.PORT || 3001;
  // 💡 ข้อควรระวัง: บน Render ห้ามลบคำว่า '0.0.0.0' เด็ดขาด เพื่อให้ภายนอกสามารถยิงเชื่อมต่อพอร์ตเข้ามาได้
  await app.listen(port, '0.0.0.0');
  
  logger.log(`==========================================================`);
  logger.log(`🚀 API Server is running on port: ${port}`);
  logger.log(`🌐 Health Check URL: http://localhost:${port}/`);
  logger.log(`📚 Swagger Docs URL: http://localhost:${port}/docs`);
  logger.log(`==========================================================`);
}
bootstrap();