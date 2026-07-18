const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // บรรทัดนี้จะเรียกไฟล์ในโฟลเดอร์ routes

const app = express();

app.use(cors()); 
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://Kuriya:K1110201292049_@localhost:27017/shop?authSource=admin';
const PORT = process.env.PORT || 3001;

mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`📡 Server is running on port ${PORT}`);
});