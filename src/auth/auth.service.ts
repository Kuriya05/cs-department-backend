// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'; 
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. ตรวจสอบว่ารหัสผ่านที่ส่งมา ตรงกับที่ Hash ไว้ในฐานข้อมูลหรือไม่
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // ถ้ารหัสถูก ให้ลบ field password ทิ้งก่อนส่งกลับ ป้องกันรหัสหลุด
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  // 2. ออกบัตรผ่าน (JWT Token) ให้กับคนที่ผ่านด่าน
  async login(user: any) {
    // ข้อมูลที่จะฝังลงไปในบัตรผ่าน (ห้ามฝังข้อมูลลับเช่นรหัสผ่าน)
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload), // ปั๊ม Token!
      user: payload,
    };
  }

  // 🛠️ 3. อัปเดตฟังก์ชันสมัครสมาชิก (Register) ให้รองรับสิทธิ์ (Role) ตาม Enum ของฐานข้อมูล
  async register(username: string, pass: string, role?: string) {
    // 3.1 ตรวจสอบก่อนว่ามี Username นี้อยู่ในระบบแล้วหรือยัง
    const existingUser = await this.usersService.findOneByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username นี้ถูกใช้งานไปแล้วในระบบ');
    }

    // 3.2 แปลงรหัสผ่านธรรมดาให้เป็นรหัสลับ (Hash) ด้วย bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltRounds);

    // 🛠️ 3.3 ตรวจสอบความถูกต้องของ Role (ถ้าพิมพ์ผิด หรือไม่ส่งมา ให้ปรับเป็น 'Staff' อัตโนมัติ)
    const validRoles = ['Admin', 'Lecturer', 'Staff'];
    const userRole = validRoles.includes(role) ? role : 'Staff';

    // 3.4 สั่งเซฟข้อมูลลงฐานข้อมูลผ่าน UsersService
    const newUser = await this.usersService.create({
      username,
      password: hashedPassword,
      role: userRole, // ใช้ค่าเลเวลสิทธิ์ที่ผ่านการตรวจสอบแล้ว
    });

    return {
      statusCode: 201,
      message: 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว!',
      user: {
        username: newUser.username,
        role: newUser.role, // ส่งสิทธิ์กลับไปโชว์ใน Postman ด้วย
      },
    };
  }
}