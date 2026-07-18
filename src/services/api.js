// src/services/api.js
import axios from 'axios';

// 🌐 1. สร้าง Instance ของ Axios พร้อมตั้งค่า URL หลักของ NestJS
const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ 2. Request Interceptor: แอบส่องก่อนส่ง Request ออกไป
// ถ้าเจอ Token ใน LocalStorage จะทำการฉีด "Bearer Token" เข้า Header ให้ทันที
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🚨 3. Response Interceptor: ดักจับข้อมูลที่ตีกลับมาจาก Backend
// ถ้า Backend ตอบกลับมาเป็น 401 Unauthorized (เช่น Token หมดอายุ หรือมั่ว Token มา)
// ระบบจะล้างตู้เซฟ (LocalStorage) แล้วส่งเด็กกลับไปหน้า Login ทันที ป้องกันระบบค้าง
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      
      // ลบ Token เสร็จแล้วสั่งเปลี่ยนหน้าไปหน้า Login (ปรับ path ตาม routing ของคุณ)
      window.location.href = '/login'; 
      alert('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }
    return Promise.reject(error);
  }
);

export default api;