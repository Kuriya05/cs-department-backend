const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key';

// 1. API สมัครใช้งานสำหรับนักศึกษา (Register)
router.post('/register', async (req, res) => {
  try {
    const { studentId, name, year } = req.body;

    // ตรวจสอบความซ้ำซ้อน: ป้องกันคนอื่นมาแอบอ้างใช้รหัสนักศึกษานี้
    const existingUser = await User.findOne({ username: studentId });
    if (existingUser) {
      return res.status(400).json({ error: 'รหัสนักศึกษานี้เคยลงทะเบียนในระบบเรียบร้อยแล้ว' });
    }

    const newStudent = new User({
      username: studentId, // ใช้วิธีล็อกอินด้วยรหัสนักศึกษา
      name: name,
      role: 'student',
      year: Number(year)
    });

    await newStudent.save();
    res.status(201).json({ message: 'ลงทะเบียนนักศึกษาสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API ล็อกอินด่วน (ใส่แค่ Identity ประจำกลุ่มแล้วเข้าได้เลย)
router.post('/login', async (req, res) => {
  try {
    const { identity, role } = req.body; // identity คือ รหัสนศ. หรือ ชื่ออาจารย์/แอดมิน

    // ค้นหาผู้ใช้ที่ตรงกับข้อมูลจำเพาะและยศที่เลือก
    const user = await User.findOne({ username: identity, role: role });
    
    if (!user) {
      return res.status(400).json({ 
        message: role === 'student' 
          ? 'ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาสมัครใช้งานก่อน' 
          : 'ไม่พบชื่ออาจารย์/ผู้ดูแลระบบนี้ กรุณาติดต่อแอดมินเพิ่มชื่อเข้าระบบ' 
      });
    }

    // สร้างสิทธิ์การเข้าถึง Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;