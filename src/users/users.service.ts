// src/users/users.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // ⚡ ทำงานอัตโนมัติเมื่อเปิดเซิร์ฟเวอร์ เพื่อเช็คว่ามีแอดมินหรือยัง
  async onModuleInit() {
    await this.createInitialAdmin();
  }

  // ➕ 🛠️ เพิ่มฟังก์ชันนี้เพื่อรองรับการสมัครสมาชิก (Register) จาก AuthService
  async create(createUserDto: any): Promise<UserDocument> {
    const newUser = new this.userModel({
      ...createUserDto,
      // ดักเอาไว้: ถ้าเผื่อหน้าบ้านไม่ได้ส่งฟิลด์ name มา ให้ใช้ชื่อเดียวกับ username ไปก่อนครับ
      name: createUserDto.name || createUserDto.username, 
    });
    
    return newUser.save(); // สั่งบันทึกลงฐานข้อมูล MongoDB จริงๆ
  }

  // 🔍 ค้นหาแอดมินทั้งหมด (ใช้ดูข้อมูลในระบบ)
  async findAll() {
    // คืนค่าทั้งหมด ยกเว้นฟิลด์ password เพื่อความปลอดภัย
    return this.userModel.find().select('-password').exec();
  }

  // 🔑 ค้นหาจาก Username (ส่งให้ AuthModule ใช้ตรวจรหัสตอน Login)
  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  // 🛡️ ฟังก์ชันลับสำหรับสร้างแอดมินคนแรก
  private async createInitialAdmin() {
    const adminExists = await this.userModel.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // เข้ารหัสผ่านก่อนบันทึกลงฐานข้อมูล
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newAdmin = new this.userModel({
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'Admin',
      });
      
      await newAdmin.save();
      this.logger.log('✅ สร้างบัญชีผู้ดูแลระบบสำเร็จ (Username: admin / Password: password123)');
    }
  }
}