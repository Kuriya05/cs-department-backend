const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  careerGoal: { type: String, required: true },
  recommendCourses: [{
    courseCode: String,
    courseName: String
  }],
  reason: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);