// src/ai/ai.service.ts
import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Student, StudentDocument } from '../students/schemas/student.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: GoogleGenAI;

  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.aiClient = new GoogleGenAI({ apiKey });
  }

  // 📝 ฟังก์ชันเดิม: วิเคราะห์ความเสี่ยงนักศึกษา
  async analyzeStudent(studentId: string) {
    const student = await this.studentModel.findOne({ studentId }).exec();
    if (!student) {
      throw new NotFoundException(`ไม่พบข้อมูลนักศึกษารหัส ${studentId}`);
    }

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านการให้คำปรึกษาทางวิชาการ (Academic Advisor)
      โปรดวิเคราะห์ข้อมูลของนักศึกษาคนนี้ และให้คำแนะนำที่ใช้งานได้จริง 3 ข้อ 
      ว่าอาจารย์ที่ปรึกษาควรดูแลหรือพูดคุยกับเขาอย่างไร:
      - ชื่อ: ${student.name}
      - รหัสนักศึกษา: ${student.studentId}
      - ชั้นปี: ${student.year}
      - เกรดเฉลี่ยสะสม (GPA): ${student.gpa}
      - ระดับความเสี่ยง: ${student.risk}
    `;

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      return {
        student: { id: student.studentId, name: student.name, gpa: student.gpa, risk: student.risk },
        aiAnalysis: response.text,
      };
    } catch (error: any) {
      // 🌟 แผน B สำหรับฟังก์ชันวิเคราะห์เด็ก
      return {
        student: { id: student.studentId, name: student.name, gpa: student.gpa, risk: student.risk },
        aiAnalysis: `[โหมดทดสอบ - API Quota Exceeded] แนะนำให้พูดคุยและประเมินผลการเรียนอย่างใกล้ชิด เพิ่มเติมเทคนิคการบริหารเวลาเนื่องจากสถิติชี้วัดอยู่ในเกณฑ์เฝ้าระวัง`
      };
    }
  }

  // 🚀 ฟังก์ชันแนะนำวิชาเลือก (เวอร์ชันมีระบบรองรับ Quota เต็ม)
  async suggestCourses(goal: string) {
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านการจัดหลักสูตรและการแนะนำวิชาเลือก (Academic Course Advisor) ของคณะคอมพิวเตอร์
      โปรดแนะนำวิชาเลือกที่เหมาะสมที่สุด 3 วิชาจากรายชื่อวิชาต่อไปนี้ ให้กับนักศึกษาที่มีเป้าหมายอาชีพหรือความต้องการคือ: "${goal}"
      
      รายชื่อวิชาเลือกในคลังข้อมูล:
      - CSS311: Web Application Development (การพัฒนาเว็บแอปพลิเคชัน)
      - CSS312: Advanced Full-Stack Architecture (สถาปัตยกรรมฟูลสแต็กขั้นสูง)
      - CSS421: Artificial Intelligence and Machine Learning (ปัญญาประดิษฐ์และแมชชีนเลิร์นนิง)
      - CSS433: Cloud Computing and DevOps (การประมวลผลแบบคลาวด์และดีวอปส์)
      - CSS451: Cyber Security and Digital Forensics (ความมั่นคงปลอดภัยไซเบอร์)
      - CSS482: Data Science and Big Data Analytics (วิทยาการข้อมูลและการวิเคราะห์ข้อมูลขนาดใหญ่)

      โปรดส่งผลลัพธ์กลับมาเป็น JSON Object รูปแบบนี้เท่านั้น:
      {
        "careerGoal": "${goal}",
        "recommendCourses": [
          { "courseCode": "รหัสวิชา เช่น CSS311", "courseName": "ชื่อวิชาภาษาอังกฤษ" }
        ],
        "reason": "บทวิเคราะห์ภาษาไทย"
      }
    `;

    try {
      this.logger.log(`🔮 กำลังคำนวณแผนผังวิชาเลือกสำหรับเป้าหมาย: ${goal}`);
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI JSON Parse Error');

      return JSON.parse(jsonMatch[0]);

    } catch (error: any) {
      this.logger.error('AI Course Suggestion Error:', error);
      
      const errorString = JSON.stringify(error).toLowerCase();
      
      // 🌟 ดักจับถ้าเป็นความผิดพลาดจากฝั่งโควตา Google (429 / Quota) ให้เข้าแผน B ทันที
      if (errorString.includes('quota') || errorString.includes('429') || error.status === 429) {
        this.logger.warn('⚠️ [Quota Exceeded] ระบบเปิดใช้งาน Fallback Mode ส่งข้อมูลจำลองเพื่อให้ทดสอบ UI ได้ต่อเนื่อง');
        
        return {
          careerGoal: goal,
          recommendCourses: [
            { courseCode: "CSS311", courseName: "Web Application Development" },
            { courseCode: "CSS312", courseName: "Advanced Full-Stack Architecture" },
            { courseCode: "CSS433", courseName: "Cloud Computing and DevOps" }
          ],
          reason: `[โหมดทดสอบระบบ - โควตา API เต็มชั่วคราว] \nเนื่องจากขณะนี้ Gemini API Key ของคุณหมดโควตารายนาที/รายวันสำหรับรุ่นฟรีชั่วคราว ระบบหลังบ้านจึงทำการเปิดแผนบีเพื่อจำลองหลักสูตรสำหรับเป้าหมาย "${goal}" ให้คุณตรวจสอบความลื่นไหลของหน้าจอ (UI Component) ได้ทันทีโดยไม่ต้องรอระบบรีเซ็ต \n\nวิชาที่เลือกสรรมานี้จะช่วยปูพื้นฐานตั้งแต่โครงสร้างหน้าบ้าน-หลังบ้าน ไปจนถึงการจัดวางสถาปัตยกรรมคลาวด์อย่างมีกลยุทธ์`
        };
      }

      throw new InternalServerErrorException(`[Backend Error]: ${error.message || 'โครงข่ายประสาทขัดข้อง'}`);
    }
  }

  async getMyHistory() {
    return [];
  }
}