const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // ใช้เป็น รหัสนศ. (นักศึกษา) หรือ ชื่อผู้ใช้ (อาจารย์/แอดมิน)
  name: { type: String, required: true },                    // ชื่อ-นามสกุลจริง
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  year: { type: Number, default: null }                      // สำหรับนักศึกษา (ปี 1 - 4)
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);