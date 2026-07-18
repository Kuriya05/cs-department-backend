import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';

@Injectable()
export class ChatService {
  // 📍 ท่อตรงชี้เป้าไปที่เซิร์ฟเวอร์ Python AI Microservice ที่เรากำลังรันอยู่
  private readonly pythonAiUrl = 'http://127.0.0.1:8000';

  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  /**
   * 💬 [Feature 5] AI Chatbot สำหรับสาขา 
   * ทำการสกัด Intent คีย์เวิร์ด แล้วดึงข้อมูลจาก MongoDB มาตอบผู้ใช้งาน
   */
  async handleChatMessage(message: string) {
    // 🔍 สกัดคีย์เวิร์ดวิชาเรียนและภาคเรียนจากคำถามผู้ใช้
    const containsAI = message.toLowerCase().includes('ai') || message.includes('ปัญญาประดิษฐ์');
    const containsYear = message.includes('2569') || message.includes('69');

    // 1. จำลองการแปลง Intent ไปหา MongoDB (กรณีผู้ใช้ถามเรื่องจำนวนคนเรียนวิชา AI ปี 2569)
    if (containsAI && containsYear) {
      // 🔌 ดึงข้อมูลวิชาเรียนจริงจากฐานข้อมูลที่ระบุชื่อว่า AI ในปีการศึกษา 2569
      const courseData = await this.courseModel.findOne({
        $or: [
          { courseCode: /ai/i },
          { courseName: /ai/i },
          { courseName: /artificial intelligence/i },
          { courseName: /ปัญญาประดิษฐ์/i }
        ],
        semester: /2569/
      }).exec();

      // ดึงรายชื่อนักศึกษาทั้งหมดในระบบมาวิเคราะห์จับคู่
      const studentsCount = await this.studentModel.countDocuments().exec();

      if (!courseData) {
        return {
          reply: `🤖 จากการตรวจสอบระบบฐานข้อมูลในปีการศึกษา 2569 ยังไม่มีการเปิดการเรียนการสอนหรือบันทึกข้อมูลในรายวิชา AI ครับ`
        };
      }

      // 🧠 เมื่อได้ข้อมูลจริงจาก MongoDB แล้ว นำมาจัดสายตอบกลับประมวลผล (ส่งให้ AI จำลองตอบ)
      return {
        reply: `🤖 บอท AI ตรวจสอบข้อมูลปี 2569 ให้แล้วครับ: ในรายวิชา "${courseData.courseName}" (${courseData.courseCode}) สอนโดย ${courseData.teacher} มีหน่วยกิตจำนวน ${courseData.credit} หน่วยกิต โดยในระบบมีข้อมูลนักศึกษาลงทะเบียนสะสมรวมอยู่ทั้งหมด ${studentsCount} คนครับ`
      };
    }

    // 2. กรณีผู้ใช้ถามคำถามอื่น ๆ ทั่วไป
    const totalStudents = await this.studentModel.countDocuments().exec();
    const totalCourses = await this.courseModel.countDocuments().exec();

    return {
      reply: `🤖 สวัสดีครับผมคือระบบ AI Chatbot คณะวิทยฯ ตอนนี้ในฐานข้อมูลจริงมีนักศึกษาทั้งหมด ${totalStudents} คน และวิชาเรียนเปิดสอนอยู่ ${totalCourses} วิชา คุณต้องการให้ผมช่วยค้นหาหรือสรุปรายงานข้อมูลจุดไหนแจ้งได้เลยครับ`
    };
  }

  /**
   * 🔴 [Feature 2] AI Predict นักศึกษาที่มีความเสี่ยง
   * ส่งข้อมูลดิบข้ามค่ายไปให้ Python ช่วยคำนวณและประเมินเปอร์เซ็นต์ความเสี่ยง
   */
  async predictStudentRisk(gpa: number, attendanceRate: number, droppedCourses: number) {
    try {
      const response = await fetch(`${this.pythonAiUrl}/api/ai/predict-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpa: gpa,
          attendance_rate: attendanceRate,
          dropped_courses: droppedCourses,
        }),
      });
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        message: 'หลังบ้าน NestJS ไม่สามารถติดต่อกับ Python AI Engine ได้',
        error: error.message 
      };
    }
  }

  /**
   * 💡 [Feature 3] AI Course Recommendation (แนะนำวิชาสไตล์ Netflix)
   * ยิงเป้าหมายอาชีพไปให้ Python ประมวลผล Course Matching ออกมาให้
   */
  async getCourseRecommendation(careerGoal: string) {
    try {
      const response = await fetch(`${this.pythonAiUrl}/api/ai/recommend-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goal: careerGoal }),
      });
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        message: 'หลังบ้าน NestJS ไม่สามารถติดต่อกับ Python AI Engine ได้',
        error: error.message 
      };
    }
  }
}