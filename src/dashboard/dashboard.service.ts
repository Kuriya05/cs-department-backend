import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Lecturer, LecturerDocument } from '../lecturers/schemas/lecturer.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Lecturer.name) private readonly lecturerModel: Model<LecturerDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  /**
   * 📈 1. ฟังก์ชันดึงเฉพาะตัวเลขสถิติภาพรวมด่วน (Quick Stats)
   */
  async getQuickStats() {
    // รันคิวรีพร้อมกันแบบ Parallel เพื่อประหยัดเวลา Response
    const [totalStudents, totalLecturers, totalCourses, gpaResult] = await Promise.all([
      this.studentModel.countDocuments().exec(),
      this.lecturerModel.countDocuments({ status: 'Active' }).exec(),
      this.courseModel.countDocuments().exec(),
      this.studentModel.aggregate([
        { $group: { _id: null, avgGpa: { $avg: '$gpa' } } }
      ]).exec()
    ]);

    const avgGPA = gpaResult[0]?.avgGpa || 0;

    return {
      totalStudents,
      totalLecturers,
      totalCourses,
      avgGpa: parseFloat(avgGPA.toFixed(2)),
    };
  }

  /**
   * 📊 2. ฟังก์ชันดึงข้อมูลเจาะลึก (รวมการคำนวณกลุ่มเสี่ยงและภาระงานอาจารย์)
   */
  async getDashboardData(filterOptions?: { year?: number; semester?: string }) {
    const studentMatch: any = {};
    if (filterOptions?.year) {
      studentMatch.year = filterOptions.year;
    }

    const [riskStats, workloadStats, currentStats] = await Promise.all([
      // 🔴 นับกลุ่มเสี่ยงเฝ้าระวังของนักศึกษา
      this.studentModel.aggregate([
        { $match: studentMatch },
        { $group: { _id: '$risk', count: { $sum: 1 } } }
      ]).exec(),

      // 👨‍🏫 คำนวณภาระงานอาจารย์
      this.lecturerModel.aggregate([
        { $match: { status: 'Active' } },
        { 
          $group: { 
            _id: null, 
            avgWorkload: { $avg: '$workload' },
            totalWorkload: { $sum: '$workload' }
          } 
        }
      ]).exec(),

      // ดึงตัวเลขสถิติตัวพื้นฐานมารวม
      this.getQuickStats()
    ]);

    // จัดโครงสร้างการกระจายความเสี่ยง (Risk Distribution)
    const riskDistribution = riskStats.reduce((acc, curr) => {
      acc[curr._id || 'Normal'] = curr.count;
      return acc;
    }, { High: 0, Medium: 0, Low: 0, Normal: 0 });

    // คำนวณยอดรวมเด็กนักเรียนที่อยู่ในกลุ่มเสี่ยง (High + Medium + Low)
    const totalRiskStudents = 
      (riskDistribution['High'] || 0) + 
      (riskDistribution['Medium'] || 0) + 
      (riskDistribution['Low'] || 0);

    return {
      overview: {
        ...currentStats,
        riskStudents: totalRiskStudents,
      },
      charts: {
        riskDistribution,
        lecturerWorkload: {
          average: parseFloat((workloadStats[0]?.avgWorkload || 0).toFixed(2)),
          total: workloadStats[0]?.totalWorkload || 0
        }
      }
    };
  }
}