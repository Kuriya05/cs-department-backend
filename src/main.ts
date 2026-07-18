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

  // 🛡️ 1. ติดตั้ง Helmet Security Headers (ปรับให้ยืดหยุ่นขึ้นสำหรับ Swagger UI บน Production)
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
    }),
  );

  // 📦 2. จำกัดขนาด JSON Payload
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 🌐 3. ตั้งค่า Prefix ให้ API 
  // 🟢 [แก้ไข]: แยกหน้า Docs และ Health Check ออกจากการโดน Prefix ครอบ
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'docs'],
  });

  // 🟢 4. หน้าต้อนรับ Health Check (เข้าผ่านพาร์ทนอกสุด http://...onrender.com/ ได้เลย)
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

  // 🌍 6. ระบบ CORS 
  // 🟢 [แก้ไข]: เพิ่มให้รองรับ localhost ทั้งพอร์ต 3000 และ 3001 (Next.js) และยืดหยุ่นขึ้นใน Production
  const rawFrontendUrls = configService.get<string>('FRONTEND_URL') || '';
  let allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];

  if (rawFrontendUrls) {
    const prodOrigins = rawFrontendUrls.split(',').map(url => url.trim());
    allowedOrigins = [...allowedOrigins, ...prodOrigins];
  } else {
    // 💡 ป้องกันกรณีลืมตั้งค่าบน Render: ยอมรับชั่วคราวเพื่อให้ข้อมูลไม่โล่ง
    allowedOrigins = '*'; 
  }

  app.enableCors({
    origin: allowedOrigins, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    credentials: allowedOrigins === '*' ? false : true, // ถ้าเป็น '*' ต้องปิด credentials ไม่งั้น browser จะบล็อก
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
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`==========================================================`);
  logger.log(`🚀 API Server is running on port: ${port}`);
  logger.log(`🌐 Health Check URL: http://localhost:${port}/`);
  logger.log(`📚 Swagger Docs URL: http://localhost:${port}/docs`);
  logger.log(`==========================================================`);
}
bootstrap();