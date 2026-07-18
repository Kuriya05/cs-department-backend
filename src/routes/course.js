const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// 1. API สำหรับ Admin เพิ่มรายวิชา
router.post('/add', async (req, res) => {
  try {
    const { courseCode, courseName, credits, year } = req.body;
    
    const newCourse = new Course({ courseCode, courseName, credits, year });
    await newCourse.save();
    
    res.status(201).json({ message: 'เพิ่มรายวิชาสำเร็จแล้ว' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API สำหรับดึงรายวิชาตามชั้นปี (เช่น /api/courses/year/1)
router.get('/year/:yearNum', async (req, res) => {
  try {
    const yearNum = parseInt(req.params.yearNum);
    const courses = await Course.find({ year: yearNum });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;