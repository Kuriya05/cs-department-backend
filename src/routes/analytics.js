const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// 1. API คำนวณเปอร์เซ็นต์, วิเคราะห์ AI และบันทึกลง MongoDB
router.post('/analyze', async (req, res) => {
  try {
    const { courseCode, courseName, year, collectedScore, examScore } = req.body;
    
    // คำนวณคะแนนรวมที่ได้ (เต็ม 100)
    const totalScore = Number(collectedScore) + Number(examScore);
    
    // สมมติเกณฑ์มาตรฐานคะแนนเฉลี่ยของภาควิชาอยู่ที่ 75 คะแนน
    const standardScore = 75;
    let dropRate = 0;
    
    if (totalScore < standardScore) {
      dropRate = Math.round(((standardScore - totalScore) / standardScore) * 100);
    }

    // AI Logic สำหรับประเมินความเสี่ยงหลักสูตร
    let analysis = "ผลการเรียนภาพรวมปกติ หัวข้อเนื้อหาไม่มีจุดวิกฤต บรรลุตาม Objective ของหลักสูตร";
    let suggest = "ดำเนินแผนจัดการเรียนการสอนตามเกณฑ์มาตรฐานเดิม";

    if (dropRate >= 35) {
      analysis = `💥 วิกฤตรุนแรง: นักศึกษาส่วนใหญ่ขาดทักษะพื้นฐานหลัก ประสบปัญหาการประยุกต์ใช้ Logic ในขั้นสูง`;
      suggest = `🚨 จำเป็นต้องยกเครื่องแนวการสอน เพิ่มชั่วโมงปฏิบัติแบบ 1-on-1 หรือจัดสอบแก้ตัวเก็บคะแนนใหม่`;
    } else if (dropRate >= 20) {
      analysis = `⚠️ แจ้งเตือน: นักศึกษาส่วนใหญ่ติดขัดปัญหารุนแรงเชิงตรรกะในหัวข้อโครงสร้างหลักของวิชา`;
      suggest = `💡 ควรเพิ่มเซสชัน Workshop ติวเข้มแบบเน้นปฏิบัติจริงเร่งด่วนในสัปดาห์ถัดไป`;
    }

    const newRecord = new Analytics({
      courseCode, courseName, year,
      collectedScore, examScore, dropRate,
      analysis, suggest
    });

    await newRecord.save();
    res.status(201).json({ message: 'วิเคราะห์และบันทึกข้อมูลสำเร็จ', data: newRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API เรียกประวัติการประเมินทั้งหมด
router.get('/history', async (req, res) => {
  try {
    const history = await Analytics.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;