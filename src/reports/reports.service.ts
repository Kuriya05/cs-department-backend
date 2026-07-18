// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';

import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Lecturer, LecturerDocument } from '../lecturers/schemas/lecturer.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Lecturer.name) private readonly lecturerModel: Model<LecturerDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  // 📝 1. รายงานนักศึกษา (เดี่ยว)
  async generateStudentsExcel(): Promise<ExcelJS.Workbook> {
    const students = await this.studentModel.find().sort({ studentId: 1 }).exec();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายชื่อนักศึกษา', { views: [{ state: 'frozen', ySplit: 1 }] });

    worksheet.columns = [
      { header: 'รหัสนักศึกษา', key: 'studentId', width: 20 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'อีเมล', key: 'email', width: 25 },
      { header: 'ชั้นปี', key: 'year', width: 10 },
      { header: 'GPA', key: 'gpa', width: 15 },
      { header: 'ความเสี่ยง', key: 'risk', width: 15 },
    ];

    this.styleHeader(worksheet, 'FF1976D2'); // สีน้ำเงิน

    students.forEach((student, index) => {
      const row = worksheet.addRow(student.toObject());
      this.styleDataRow(row, index);
      
      if (student.risk === 'High') {
        row.getCell('risk').font = { color: { argb: 'FFFF0000' }, bold: true };
        row.getCell('risk').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }; // พื้นหลังแดงอ่อน
      }
    });

    return workbook;
  }

  // 👨‍🏫 2. รายงานอาจารย์และภาระงาน (เดี่ยว)
  async generateLecturersExcel(): Promise<ExcelJS.Workbook> {
    const lecturers = await this.lecturerModel.find().sort({ lecturerId: 1 }).exec();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ภาระงานอาจารย์', { views: [{ state: 'frozen', ySplit: 1 }] });

    worksheet.columns = [
      { header: 'รหัสบุคลากร', key: 'lecturerId', width: 20 },
      { header: 'ตำแหน่งทางวิชาการ', key: 'academicTitle', width: 20 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'ภาระงาน (หน่วยกิต)', key: 'workload', width: 20 },
    ];

    this.styleHeader(worksheet, 'FF2E7D32'); // สีเขียวเข้ม

    lecturers.forEach((lecturer, index) => {
      const row = worksheet.addRow(lecturer.toObject());
      this.styleDataRow(row, index);
      
      if (lecturer.workload > 15) {
        row.getCell('workload').font = { color: { argb: 'FFFF0000' }, bold: true };
        row.getCell('workload').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      }
    });

    return workbook;
  }

  // 📚 3. รายงานรายวิชา (เดี่ยว)
  async generateCoursesExcel(): Promise<ExcelJS.Workbook> {
    const courses = await this.courseModel.find().sort({ courseId: 1 }).exec();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายวิชาทั้งหมด', { views: [{ state: 'frozen', ySplit: 1 }] });

    worksheet.columns = [
      { header: 'รหัสวิชา', key: 'courseId', width: 15 },
      { header: 'ชื่อวิชา', key: 'name', width: 40 },
      { header: 'หน่วยกิต', key: 'credits', width: 15 },
      { header: 'หมวดหมู่', key: 'category', width: 25 },
      { header: 'สถานะ', key: 'status', width: 15 },
    ];

    this.styleHeader(worksheet, 'FFF57C00'); // สีส้ม

    courses.forEach((course, index) => {
      const row = worksheet.addRow(course.toObject());
      this.styleDataRow(row, index);
    });

    return workbook;
  }

  // 🏆 4. Master Report (รวมพลัง 3 Sheets ในไฟล์เดียวตามที่ Controller ค้นหา)
  async generateMasterReport(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CS Department MIS';

    // ดึงข้อมูลพร้อมกันแบบ Parallel เพื่อความรวดเร็ว
    const [students, lecturers, courses] = await Promise.all([
      this.studentModel.find().sort({ studentId: 1 }).exec(),
      this.lecturerModel.find().sort({ lecturerId: 1 }).exec(),
      this.courseModel.find().sort({ courseId: 1 }).exec(),
    ]);

    // --- Tab 1: นักศึกษา ---
    const studentSheet = workbook.addWorksheet('1. รายชื่อนักศึกษา', { views: [{ state: 'frozen', ySplit: 1 }] });
    studentSheet.columns = [
      { header: 'รหัสนักศึกษา', key: 'studentId', width: 20 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'อีเมล', key: 'email', width: 25 },
      { header: 'ชั้นปี', key: 'year', width: 10 },
      { header: 'GPA', key: 'gpa', width: 15 },
      { header: 'ความเสี่ยง', key: 'risk', width: 15 },
    ];
    this.styleHeader(studentSheet, 'FF1976D2');
    students.forEach((student, index) => {
      const row = studentSheet.addRow(student.toObject());
      this.styleDataRow(row, index);
      if (student.risk === 'High') {
        row.getCell('risk').font = { color: { argb: 'FFFF0000' }, bold: true };
        row.getCell('risk').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      }
    });

    // --- Tab 2: อาจารย์ ---
    const lecturerSheet = workbook.addWorksheet('2. ภาระงานอาจารย์', { views: [{ state: 'frozen', ySplit: 1 }] });
    lecturerSheet.columns = [
      { header: 'รหัสบุคลากร', key: 'lecturerId', width: 20 },
      { header: 'ตำแหน่งทางวิชาการ', key: 'academicTitle', width: 20 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'ภาระงาน (หน่วยกิต)', key: 'workload', width: 20 },
    ];
    this.styleHeader(lecturerSheet, 'FF2E7D32');
    lecturers.forEach((lecturer, index) => {
      const row = lecturerSheet.addRow(lecturer.toObject());
      this.styleDataRow(row, index);
      if (lecturer.workload > 15) {
        row.getCell('workload').font = { color: { argb: 'FFFF0000' }, bold: true };
        row.getCell('workload').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      }
    });

    // --- Tab 3: รายวิชา ---
    const courseSheet = workbook.addWorksheet('3. รายวิชาทั้งหมด', { views: [{ state: 'frozen', ySplit: 1 }] });
    courseSheet.columns = [
      { header: 'รหัสวิชา', key: 'courseId', width: 15 },
      { header: 'ชื่อวิชา', key: 'name', width: 40 },
      { header: 'หน่วยกิต', key: 'credits', width: 15 },
      { header: 'หมวดหมู่', key: 'category', width: 25 },
      { header: 'สถานะ', key: 'status', width: 15 },
    ];
    this.styleHeader(courseSheet, 'FFF57C00');
    courses.forEach((course, index) => {
      const row = courseSheet.addRow(course.toObject());
      this.styleDataRow(row, index);
    });

    return workbook;
  }

  // 🎨 ฟังก์ชันตัวช่วย (Helper) สำหรับแต่งสีหัวตาราง
  private styleHeader(worksheet: ExcelJS.Worksheet, hexColor: string) {
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25; // เพิ่มความสูงหัวตารางให้ดูโปร่ง
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
      };
    });
  }

  // 🎨 ฟังก์ชันตัวช่วยสำหรับตกแต่งแถวข้อมูล (Zebra Striving + Borders)
  private styleDataRow(row: ExcelJS.Row, index: number) {
    row.height = 20; // ความสูงแถวอ่านง่ายกำลังดี
    
    // ทำสีสลับแถว (แถวคู่สีขาว แถวคี่สีเทาอ่อนสุดๆ)
    const isEven = index % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF9F9F9';

    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      // ใส่ขอบเส้นบางๆ ให้ทุกเซลล์
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });
  }
}