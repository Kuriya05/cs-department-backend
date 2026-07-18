const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  year: { type: Number, required: true },
  collectedScore: { type: Number, required: true },
  examScore: { type: Number, required: true },
  dropRate: { type: Number, required: true },
  analysis: { type: String, required: true },
  suggest: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);