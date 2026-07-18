const express = require('express');
const router = express.Router();
const Workload = require('../models/Workload');

// 1. API บันทึกผลการประเมินลงฐานข้อมูล MongoDB
router.post('/calculate', async (req, res) => {
  try {
    const { name, subjects, students, research, workload, recommend } = req.body;
    
    const newRecord = new Workload({ name, subjects, students, research, workload, recommend });
    await newRecord.save();
    
    res.status(201).json({ message: 'บันทึกข้อมูลภาระงานสำเร็จ', data: newRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API ดึงประวัติการประเมินทั้งหมดมาแสดงผล
router.get('/all', async (req, res) => {
  try {
    const history = await Workload.find().sort({ createdAt: -1 }); // ล่าสุดขึ้นก่อน
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;