// ==========================================
// 🚀 DEPENDENCIES & INITIALIZATION
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // เพื่อให้อ่านค่าจากไฟล์ .env ตอนรันในเครื่องตัวเองได้

// 🛣️ IMPORT ROUTES
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const studentRoutes = require('./routes/student');

const app = express();

// ==========================================
// 🛡️ MIDDLEWARES
// ==========================================
// เปิดใช้งาน CORS เพื่อให้ Frontend (Next.js) ที่อยู่คนละ Server ยิงข้ามมาดึงข้อมูลได้
app.use(cors()); 

// เปิดใช้งาน JSON Parser เพื่อให้รองรับการส่งข้อมูลแบบ JSON จากหน้าบ้าน (req.body)
app.use(express.json());

// ==========================================
// 💾 DATABASE CONNECTION
// ==========================================
// ดึงข้อมูล Cloud MongoDB URI จาก Environment Variables (Fallback เป็น Local สำหรับสำรอง)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://Kuriya:K1110201292049_@localhost:27017/shop?authSource=admin';
const PORT = process.env.PORT || 3001;

// เชื่อมต่อเข้าฐานข้อมูล MongoDB Atlas (Cloud)
mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 MongoDB Connected Successfully via Cloud Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 🌐 API ROUTING (เส้นทางการคุยกับหน้าบ้าน)
// ==========================================
// 🔒 ระบบจัดการผู้ใช้งานและการล็อกอิน
app.use('/api/auth', authRoutes);

// 📚 ระบบจัดการข้อมูลรายวิชา (ที่หน้าบ้าน Next.js ยิงเข้ามาหา)
app.use('/api/v1/courses', courseRoutes);

// 👨‍🎓 ระบบจัดการข้อมูลนักศึกษา
app.use('/api/v1/students', studentRoutes);

// 🛠️ ตรวจสอบกรณีเรียกเส้นทาง (Path) ที่ไม่มีอยู่ในระบบ Backend
app.use((req, res, next) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.url}`,
    error: "Not Found",
    statusCode: 404
  });
});

// ==========================================
// 📡 SERVER STARTUP
// ==========================================
app.listen(PORT, () => {
  console.log(`📡 Server Engine Online on port ${PORT}`);
  console.log(`👉 Environment Status: ${process.env.NODE_ENV || 'development'}`);
});