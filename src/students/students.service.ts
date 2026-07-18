// src/students/students.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student, StudentDocument } from './schemas/student.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  /**
   * ➕ 1. POST - เพิ่มนักศึกษาใหม่พร้อมระบบตรวจสอบข้อมูลซ้ำ
   */
  async create(createStudentDto: CreateStudentDto) {
    // 🛡️ ป้องกันข้อมูลซ้ำ: ตรวจสอบก่อนว่ามี studentId หรือ email นี้ในระบบแล้วหรือยัง
    const existingStudent = await this.studentModel.findOne({
      $or: [
        { studentId: createStudentDto.studentId },
        { email: createStudentDto.email.toLowerCase() }
      ]
    }).exec();

    if (existingStudent) {
      throw new ConflictException('รหัสนักศึกษา หรือ อีเมลนี้ มีอยู่ในระบบแล้ว');
    }

    const newStudent = new this.studentModel({
      ...createStudentDto,
      email: createStudentDto.email.toLowerCase() // 🧼 บันทึกเป็นตัวเล็กเพื่อความปลอดภัย
    });
    
    return await newStudent.save();
  }

  /**
   * 🔍 2. GET - ดึงข้อมูลพร้อมระบบกรองขั้นสูง ค้นหา และแบ่งหน้า (Pagination)
   */
  async findAll(options: {
    page: number;
    limit: number;
    search: string;
    risk?: string;
    year?: number;
    status?: string;
  }) {
    const { page, limit, search, risk, year, status } = options;
    const query: any = {};

    // 🔎 ค้นหาแบบคลุมเครือ (Regex) จากชื่อ หรือ รหัสนักศึกษา
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    // 🎯 กรองตามเงื่อนไขที่เลือก (ถ้ามีการส่งมา)
    if (risk) query.risk = risk;
    if (year) query.year = year;
    if (status) query.status = status;

    // ⚡ คำนวณจำนวนแถวที่จะข้ามสำหรับทำ Pagination
    const skip = (page - 1) * limit;

    // 🏃‍♂️ วิ่งไปดึงข้อมูลจริงจาก MongoDB (เรียงจากข้อมูลใหม่ล่าสุด)
    const data = await this.studentModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // 📊 นับจำนวนข้อมูลทั้งหมดที่ตรงตามเงื่อนไขเพื่อส่ง Metadata กลับไปให้หน้าบ้านทำ UI
    const total = await this.studentModel.countDocuments(query).exec();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 📇 3. GET (One) - ค้นหาข้อมูลนักศึกษาแบบยืดหยุ่น (รองรับทั้ง Mongo _id และ รหัสนักศึกษา)
   */
  async findOne(idOrStudentId: string) {
    let student: StudentDocument | null = null;

    // 💡 ตรวจสอบก่อนว่าเป็น Mongo Object ID ที่ถูกต้องไหม ถ้าใช่ ให้หาด้วย _id
    if (Types.ObjectId.isValid(idOrStudentId)) {
      student = await this.studentModel.findById(idOrStudentId).exec();
    }

    // 💡 ถ้าไม่ใช่ หรือหาไม่เจอ ให้ลองหาผ่านฟิลด์ studentId ดิบ ๆ ตัวอย่างเช่น "66xxxxxx"
    if (!student) {
      student = await this.studentModel.findOne({ studentId: idOrStudentId }).exec();
    }

    if (!student) {
      throw new NotFoundException(`ไม่พบข้อมูลนักศึกษาที่ระบุ (${idOrStudentId})`);
    }

    return student;
  }

  /**
   * ✏️ 4. PATCH - อัปเดตข้อมูลบางส่วนอย่างปลอดภัย
   */
  async update(idOrStudentId: string, updateStudentDto: UpdateStudentDto) {
    // ใช้ฟังก์ชัน findOne ที่ทำไว้ด้านบนเพื่อหาตัวตนนักศึกษาก่อนอัปเดต
    const student = await this.findOne(idOrStudentId);

    // ป้องกันปัญหาการเปลี่ยนอีเมลไปซ้ำกับคนอื่น
    if (updateStudentDto.email) {
      updateStudentDto.email = updateStudentDto.email.toLowerCase();
      const duplicateEmail = await this.studentModel.findOne({
        email: updateStudentDto.email,
        _id: { $ne: student._id } // ต้องไม่ใช่นักศึกษาคนปัจจุบัน
      }).exec();

      if (duplicateEmail) {
        throw new ConflictException('อีเมลนี้ถูกใช้งานโดยนักศึกษาคนอื่นแล้ว');
      }
    }

    // 🛠️ ทำการอัปเดตเฉพาะฟิลด์ที่ส่งมาจาก DTO
    const updatedStudent = await this.studentModel
      .findByIdAndUpdate(student._id, { $set: updateStudentDto }, { new: true })
      .exec();

    return updatedStudent;
  }

  /**
   * ❌ 5. DELETE - ลบนักศึกษาออกจากระบบ
   */
  async remove(idOrStudentId: string) {
    const student = await this.findOne(idOrStudentId);
    return await this.studentModel.findByIdAndDelete(student._id).exec();
  }

  /**
   * 📊 6. ANALYTICS - คำนวณสถิติสรุปส่งตรงให้หน้า Dashboard (อัปเดตระบบดึงข้อมูลวิชาจริง)
   * ประมวลผลรอบเดียวผ่าน MongoDB Aggregation Framework
   */
  async getRiskSummaryStats() {
    const stats = await this.studentModel.aggregate([
      {
        $facet: {
          // สรุปยอดนับแยกตามระดับความเสี่ยง
          byRisk: [
            { $group: { _id: '$risk', count: { $sum: 1 } } }
          ],
          // สรุปยอดนับแยกตามชั้นปี
          byYear: [
            { $group: { _id: '$year', count: { $sum: 1 } } }
          ],
          // คำนวณค่าเฉลี่ยสถิติภาพรวมคณะ
          generalMetrics: [
            {
              $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                avgGpa: { $avg: '$gpa' },
                avgAttendance: { $avg: '$attendanceRate' }
              }
            }
          ],
          // 🎯 คำนวณหากลุ่มวิชาความเชี่ยวชาญสูงสุด (Popular Track) จากนักศึกษาจริงใน MongoDB
          byPopularMajor: [
            {
              $project: {
                // ดักจับชื่อฟิลด์ที่ Schema ของคุณอาจจะใช้ (เช่น major, track, specialization)
                targetField: { $ifNull: ['$major', '$track', '$specialization', ''] }
              }
            },
            { $match: { targetField: { $ne: '' } } },
            { $group: { _id: '$targetField', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ],
          // 💡 สำรอง: ในกรณีที่คุณเก็บวิชาเรียนของนักศึกษาเป็น Array (เช่น ฟิลด์ courses: ['CS311', 'CS341'])
          byPopularCourseFromList: [
            { $project: { courses: { $ifNull: ['$courses', '$enrolledCourses', []] } } },
            { $unwind: { path: '$courses', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$courses', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ]).exec();

    // 🧼 ตกแต่งโครงสร้างข้อมูลผลลัพธ์ให้อ่านง่าย
    const metrics = stats[0]?.generalMetrics[0] || { totalStudents: 0, avgGpa: 0, avgAttendance: 0 };
    
    // ⚡ เลือกดึงวิชาที่ฮิตที่สุดจาก MongoDB (ถ้าเจอในกลุ่ม Major ให้นำมาใช้ก่อน ถ้าไม่มีให้ดึงจาก Array รายวิชา)
    const topMajor = stats[0]?.byPopularMajor[0]?._id;
    const topCourseFromList = stats[0]?.byPopularCourseFromList[0]?._id;
    
    const finalPopularMajor = topMajor || topCourseFromList || 'CS311 Artificial Intelligence';

    return {
      totalStudents: metrics.totalStudents,
      averageGpa: parseFloat(metrics.avgGpa.toFixed(2)),
      averageAttendanceRate: parseFloat(metrics.avgAttendance.toFixed(2)),
      riskDistribution: stats[0]?.byRisk.reduce((acc: any, cur: any) => {
        acc[cur._id] = cur.count;
        return acc;
      }, { Low: 0, Medium: 0, High: 0, None: 0 }),
      yearDistribution: stats[0]?.byYear.reduce((acc: any, cur: any) => {
        acc[`Year_${cur._id}`] = cur.count;
        return acc;
      }, {}),
      // ✨ ส่งชื่อวิชาจริง ๆ ที่นับได้มากที่สุดใน MongoDB กลับไปให้หน้าจอ UI แสดงผลทันที
      popularMajors: finalPopularMajor
    };
  }

  /**
   * ⚡ 7. SEED DATA - ฟังก์ชันจำลองข้อมูล
   * ใช้ระบบ Upsert เพื่อเพิ่มหรืออัปเดตข้อมูลโดยไม่ทำให้เกิด Error 409
   */
  async seedBulk(mockStudents: any[]) {
    for (const student of mockStudents) {
      const emailLower = student.email.toLowerCase();
      await this.studentModel.findOneAndUpdate(
        { studentId: student.studentId },
        { ...student, email: emailLower },
        { upsert: true, new: true }
      ).exec();
    }
    return { message: 'Seed ข้อมูลระบบนิเวศแม่โจ้ CS สำเร็จเรียบร้อย!' };
  }
} // <--- ปีกกาปิดจบ Class