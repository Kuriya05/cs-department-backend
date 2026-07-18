const express = require('express');
const router = express.Router();
const Recommendation = require('../models/Recommendation');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key';

// API ประมวลผลแนะนำวิชาตามเป้าหมาย
router.post('/suggest', async (req, res) => {
  try {
    const { goal } = req.body;
    
    // ดึง Token จาก Header เพื่อดูว่าเป็นนักศึกษาคนไหนล็อกอินอยู่
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง กรุณาล็อกอิน' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const studentId = decoded.userId;

    // 1. ดึงรายวิชาจริงทั้งหมดที่ Admin เคยเพิ่มไว้ในระบบขึ้นมา
    const allCourses = await Course.find();
    let recommendCourses = [];
    let reason = "";

    // 2. AI Logic: คัดแยกสายงานคอมพิวเตอร์ตามคีย์เวิร์ดที่กรอกเข้ามา
    if (goal.includes('Data') || goal.includes('ข้อมูล') || goal.includes('วิเคราะห์')) {
      // คัดเลือกวิชาที่เกี่ยวกับ Data หรือ Statistics จากฐานข้อมูลจริง
      recommendCourses = allCourses.filter(c => 
        c.courseName.toLowerCase().includes('data') || 
        c.courseName.toLowerCase().includes('stat') ||
        c.courseCode.includes('CS202') // ตัวอย่าง Data Structure ที่แอดมินเพิ่มไว้
      );
      reason = "💡 วิเคราะห์จากเป้าหมายด้าน Data Science: รายวิชาที่เลือกสรรเน้นการบริหารจัดการโครงสร้างข้อมูลขั้นพื้นฐานและทฤษฎีสารสนเทศ ซึ่งเป็นรากฐานสำคัญในการวิเคราะห์โมเดลเชิงสถิติ";
    } 
    else if (goal.includes('ซอฟต์แวร์') || goal.includes('Web') || goal.includes('Developer') || goal.includes('เขียนโปรแกรม')) {
      recommendCourses = allCourses.filter(c => 
        c.courseName.toLowerCase().includes('programming') || 
        c.courseName.toLowerCase().includes('software') || 
        c.courseName.toLowerCase().includes('web')
      );
      reason = "💡 วิเคราะห์จากเป้าหมายนักพัฒนาซอฟต์แวร์/เว็บ: ระบบแนะนำกลุ่มวิชาเน้นหนักด้านทักษะปฏิบัติ Coding โครงสร้างสถาปัตยกรรมซอฟต์แวร์ เพื่อสร้างแอปพลิเคชันที่พร้อมใช้งานในอุตสาหกรรม";
    }
    else {
      // หากเป็นสายคอมพิวเตอร์ทั่วไป สุ่มแนะนำรายวิชาพื้นฐานของปี 1 และ ปี 2
      recommendCourses = allCourses.filter(c => c.year <= 2).slice(0, 4);
      reason = "💡 วิเคราะห์สัดส่วนทักษะทั่วไป: แนะนำให้เริ่มเก็บฐานวิชาบังคับพื้นฐานวิทยาการคอมพิวเตอร์ชั้นปีที่ 1-2 ให้ครบถ้วน เพื่อค้นหาความเชี่ยวชาญเฉพาะทางในระดับสูงต่อไป";
    }

    // จัดรูปแบบก้อนข้อมูลที่จะส่งกลับ
    const mappedCourses = recommendCourses.map(c => ({
      courseCode: c.courseCode,
      courseName: c.courseName
    }));

    // 3. บันทึกผลลัพธ์ผูกติดกับบัญชีนักศึกษาคนนี้ลง MongoDB ถาวร
    const newRecommend = new Recommendation({
      studentId,
      careerGoal: goal,
      recommendCourses: mappedCourses,
      reason
    });
    await newRecommend.save();

    res.status(201).json(newRecommend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API สำหรับดึงประวัติการแนะนำล่าสุดของนักศึกษาคนนั้นขึ้นมาโชว์ค้างไว้
router.get('/my-history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'กรุณาล็อกอิน' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ค้นหาเฉพาะประวัติของตัวเอง หรือสิทธิ์แอดมินสามารถเปิดดูได้ทั้งหมด
    const history = await Recommendation.find({ studentId: decoded.userId }).sort({ createdAt: -1 });
    res.json(history[0] || null); // เอาคำแนะนำล่าสุดอันเดียวมาโชว์
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;