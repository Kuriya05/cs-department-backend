const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true }, // รหัสวิชา เช่น CS101
  courseName: { type: String, required: true },               // ชื่อวิชา เช่น Intro to CS
  credits: { type: Number, required: true },                  // หน่วยกิต
  year: { 
    type: Number, 
    required: true, 
    enum: [1, 2, 3, 4] // เจาะจงว่าเป็นของนักศึกษาปี 1, 2, 3 หรือ 4
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);