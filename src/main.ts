// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express'; 
import helmet from 'helmet';
import express from 'express'; 

// 🆕 1. สร้าง Instance ของ Express รอไว้ข้างนอก
const server = express();

async function bootstrap() {
  // 🆕 2. ใช้ ExpressAdapter ครอบตัวแอป NestJS เอาไว้
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
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
  app.use(express.json({ limit: '10mb' })); 
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 🌐 3. ตั้งค่า Prefix ให้ API
  app.setGlobalPrefix('api/v1');

  // 🟢 [แผนสอง - ชัวร์กว่าเดิม]: ดักหน้าแรกผ่าน HttpAdapter ของ NestJS ตรงนี้เลย 
  // มันจะไม่โดนระบบลบ และไม่ติด prefix /api/v1 ด้วยครับ
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: '🚀 CS Department MIS API is running smoothly on Vercel!',
      environment: process.env.VERCEL ? 'Production (Cloud Serverless)' : 'Local Development',
      documentation: '/docs',
      timestamp: new Date().toISOString()
    });
  });

  // 🛡️ 4. เปิดใช้งาน DTO Validation ระดับ Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  // 🌍 5. ปรับปรุงระบบ CORS ให้ยืดหยุ่นและปลอดภัยสูงขึ้น
  const rawFrontendUrls = configService.get<string>('FRONTEND_URL') || '';
  let allowedOrigins: (string | RegExp)[] = ['http://localhost:3000', 'http://127.0.0.1:3000'];

  if (rawFrontendUrls) {
    const prodOrigins = rawFrontendUrls.split(',').map(url => url.trim());
    allowedOrigins = [...allowedOrigins, ...prodOrigins];
  } else if (process.env.VERCEL) {
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }

  if (!process.env.VERCEL || rawFrontendUrls) {
    app.enableCors({
      origin: allowedOrigins, 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
      credentials: true, 
    });
  }

  // 📚 6. ระบบคู่มือ API (Swagger UI) 
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

  // 🛑 7. เปิด Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // 🚀 8. รันเซิร์ฟเวอร์
  if (process.env.VERCEL) {
    await app.init();
  } else {
    const port = parseInt(configService.get<string>('PORT') || '3001', 10);
    await app.listen(port);
    logger.log(`🚀 API Server Status     : ACTIVE (Local Dev Mode)`);
    logger.log(`🌐 Base API URL          : http://localhost:${port}/api/v1`);
  }
}
bootstrap();

// 🆕 3. ส่งออกตัวเซิร์ฟเวอร์ให้ Vercel Serverless รัน
export default server;