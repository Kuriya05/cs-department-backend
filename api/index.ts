import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module'; // เช็ก path ให้ตรงกับไฟล์ในโปรเจกต์ของคุณ
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// 1. สร้างฐาน Express ขึ้นมาเปล่าๆ
const server = express();

// 2. ฟังก์ชันช่วยผูก NestJS เข้ากับ Express 
async function createServer() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server) // สั่งให้ NestJS รันบนโครงของ Express ตัวที่เราสร้างไว้
  );
  
  app.enableCors(); // เปิด CORS ให้หน้าบ้านดึงข้อมูลได้สะดวก
  
  // (ถ้าคุณมี Global Pipes, interceptors หรือ prefix เช่น /api/v1 ให้ใส่ตรงนี้ได้เลย)
  // app.setGlobalPrefix('api/v1');

  await app.init(); // สั่งให้ NestJS เริ่มระบบภายใน (แต่ไม่ต้องสั่ง .listen พอร์ต)
}

// เรียกให้ระบบเตรียมพร้อมใช้งาน
createServer();

// 3. ส่งออกโมดูลแบบที่ Vercel Serverless Function ต้องการ
export default server;