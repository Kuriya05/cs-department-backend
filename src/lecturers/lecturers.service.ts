// src/lecturers/lecturers.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lecturer, LecturerDocument } from './schemas/lecturer.schema';
import { CreateLecturerDto } from './dto/create-lecturer.dto';

@Injectable()
export class LecturersService {
  constructor(
    @InjectModel(Lecturer.name) private lecturerModel: Model<LecturerDocument>,
  ) {}

  /**
   * 🧮 ฟังก์ชันภายใน: คำนวณภาระงานและคำแนะนำอัตโนมัติ (Automated Engine)
   * คำนวณตามจำนวนรายวิชา (subjectCount) และจำนวนนักศึกษาทั้งหมด (studentsCount)
   */
  private calculateWorkloadMetrics(subjectCount: number, studentsCount: number) {
    const subWeight = (subjectCount || 0) * 15;
    const stuWeight = (studentsCount || 0) * 0.2;
    
    // คำนวณเปอร์เซ็นต์ภาระงาน (จำกัดไว้ไม่เกิน 100%)
    const workload = Math.min(Math.round(subWeight + stuWeight), 100);
    
    // ประเมินคำแนะนำตามเกณฑ์
    let recommend = 'Optimal workload allocation.';
    if (workload >= 85) {
      recommend = 'Highly overloaded. Recommend module distribution reduction.';
    } else if (workload >= 60) {
      recommend = 'Moderate workload. Monitor closely before assigning new tasks.';
    }

    return { workload, recommend };
  }

  /**
   * ➕ 1. POST - เพิ่มข้อมูลอาจารย์ พร้อมระบบตรวจสอบป้องกันข้อมูลซ้ำและคำนวณอัตโนมัติ
   */
  async create(createLecturerDto: CreateLecturerDto): Promise<LecturerDocument> {
    // 🛡️ ป้องกันข้อมูลซ้ำ: ตรวจสอบรหัสบุคลากร หรือ อีเมล
    const existingLecturer = await this.lecturerModel.findOne({
      $or: [
        { lecturerId: createLecturerDto.lecturerId },
        { email: createLecturerDto.email?.toLowerCase() }
      ]
    }).lean().exec();

    if (existingLecturer) {
      throw new ConflictException('รหัสประจำตัวอาจารย์ หรือ อีเมลนี้ มีอยู่ในระบบแล้ว');
    }

    // 🧮 ดึงความยาวของ Array วิชา (ถ้ามี) และจำนวนนักศึกษา ไปคำนวณ Workload
    const subjectCount = createLecturerDto.subjects ? createLecturerDto.subjects.length : 0;
    const studentsCount = createLecturerDto.studentsCount || 0;
    
    const { workload, recommend } = this.calculateWorkloadMetrics(subjectCount, studentsCount);

    const newLecturer = new this.lecturerModel({
      ...createLecturerDto,
      email: createLecturerDto.email?.toLowerCase(), // บันทึกเป็นตัวเล็กเพื่อมาตรฐานเดียวกัน
      workload,
      recommend
    });
    
    return await newLecturer.save();
  }

  /**
   * 🔍 2. GET (All) - ดึงข้อมูลพร้อมระบบกรอง ค้นหา และแบ่งหน้า (Pagination)
   */
  async findAll(options: {
    page: number;
    limit: number;
    search: string;
    status?: string;
    academicTitle?: string;
  }) {
    const { page, limit, search, status, academicTitle } = options;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { lecturerId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (academicTitle) query.academicTitle = academicTitle;

    const skip = (page - 1) * limit;

    const data = await this.lecturerModel
      .find(query)
      .sort({ workload: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.lecturerModel.countDocuments(query).exec();

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
   * 📇 3. GET (One) - ค้นหาแบบยืดหยุ่น (รองรับทั้ง Mongo _id และ รหัสบุคลากร)
   */
  async findOne(idOrLecturerId: string): Promise<LecturerDocument> {
    let lecturer: LecturerDocument | null = null;

    if (Types.ObjectId.isValid(idOrLecturerId)) {
      lecturer = await this.lecturerModel.findById(idOrLecturerId).exec();
    }

    if (!lecturer) {
      lecturer = await this.lecturerModel.findOne({ lecturerId: idOrLecturerId }).exec();
    }

    if (!lecturer) {
      throw new NotFoundException(`ไม่พบข้อมูลอาจารย์รหัส/ID: ${idOrLecturerId}`);
    }

    return lecturer;
  }

  /**
   * ✏️ 4. PATCH - อัปเดตข้อมูลอย่างปลอดภัย คำนวณภาระงานใหม่เมื่อมีตัวเลขเปลี่ยนแปลง
   */
  async update(idOrLecturerId: string, updateLecturerDto: Partial<CreateLecturerDto>): Promise<LecturerDocument> {
    const lecturer = await this.findOne(idOrLecturerId);

    // ป้องกันการเปลี่ยนอีเมล หรือรหัสบุคลากรไปซ้ำกับคนอื่น
    if (updateLecturerDto.email || updateLecturerDto.lecturerId) {
      const orConditions: any[] = [];
      if (updateLecturerDto.email) orConditions.push({ email: updateLecturerDto.email.toLowerCase() });
      if (updateLecturerDto.lecturerId) orConditions.push({ lecturerId: updateLecturerDto.lecturerId });

      const duplicateCheck = await this.lecturerModel.findOne({
        $or: orConditions,
        _id: { $ne: lecturer._id }
      }).lean().exec();

      if (duplicateCheck) {
        throw new ConflictException('ไม่สามารถอัปเดตได้: รหัสบุคลากรหรืออีเมลนี้ถูกใช้งานโดยอาจารย์ท่านอื่นแล้ว');
      }
    }

    const updateData: any = { ...updateLecturerDto };

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // 🧮 ตรวจสอบว่าถ้ามีการอัปเดต 'รายวิชา' หรือ 'จำนวนนักศึกษา' ให้คำนวณ Workload ใหม่ทันที
    if (updateData.subjects !== undefined || updateData.studentsCount !== undefined) {
      const targetSubjectCount = updateData.subjects !== undefined 
        ? updateData.subjects.length 
        : (lecturer.subjects ? lecturer.subjects.length : 0);

      const targetStudentsCount = updateData.studentsCount !== undefined 
        ? updateData.studentsCount 
        : lecturer.studentsCount;

      const { workload, recommend } = this.calculateWorkloadMetrics(targetSubjectCount, targetStudentsCount);
      updateData.workload = workload;
      updateData.recommend = recommend;
    }

    const updatedLecturer = await this.lecturerModel
      .findByIdAndUpdate(lecturer._id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedLecturer) {
      throw new NotFoundException('เกิดข้อผิดพลาดระหว่างกระบวนการอัปเดตข้อมูล');
    }

    return updatedLecturer;
  }

  /**
   * ❌ 5. DELETE - ลบข้อมูลอาจารย์
   */
  async remove(idOrLecturerId: string) {
    const lecturer = await this.findOne(idOrLecturerId);
    return await this.lecturerModel.findByIdAndDelete(lecturer._id).exec();
  }

  /**
   * 📊 6. ANALYTICS - คำนวณสถิติส่งตรงให้ระบบ Dashboard
   */
  async getWorkloadSummary() {
    const stats = await this.lecturerModel.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byTitle: [
            { $group: { _id: '$academicTitle', count: { $sum: 1 } } }
          ],
          generalMetrics: [
            {
              $group: {
                _id: null,
                totalLecturers: { $sum: 1 },
                avgWorkload: { $avg: '$workload' },
                totalStudentsTaught: { $sum: '$studentsCount' },
                maxWorkload: { $max: '$workload' } 
              }
            }
          ]
        }
      }
    ]).exec();

    const metrics = stats[0]?.generalMetrics[0] || { 
      totalLecturers: 0, 
      avgWorkload: 0, 
      totalStudentsTaught: 0, 
      maxWorkload: 0 
    };

    const rawAvg = metrics.avgWorkload || 0;

    return {
      totalLecturers: metrics.totalLecturers || 0,
      totalStudentsTaught: metrics.totalStudentsTaught || 0,
      averageWorkload: parseFloat(Number(rawAvg).toFixed(2)),
      maximumWorkload: metrics.maxWorkload || 0,
      statusDistribution: (stats[0]?.byStatus || []).reduce((acc: any, cur: any) => {
        if (cur._id) acc[cur._id] = cur.count;
        return acc;
      }, {}),
      titleDistribution: (stats[0]?.byTitle || []).reduce((acc: any, cur: any) => {
        if (cur._id) acc[cur._id] = cur.count;
        return acc;
      }, {})
    };
  }
}