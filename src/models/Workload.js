const mongoose = require('mongoose');

const workloadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: { type: Number, required: true },
  students: { type: Number, required: true },
  research: { type: Number, required: true },
  workload: { type: Number, required: true },
  recommend: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Workload', workloadSchema);