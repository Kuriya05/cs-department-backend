import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student } from './schemas/student.schema'; // เช็ก path ให้ตรงกับเครื่องคุณนะครับ
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const newStudent = new this.studentModel(createStudentDto);
    return newStudent.save();
  }

  async findAll() {
    return this.studentModel.find().exec();
  }

  // ... ฟังก์ชัน findOne และ remove ให้เรียกผ่าน this.studentModel ...
}