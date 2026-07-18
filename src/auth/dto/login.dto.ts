// src/auth/dto/login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุ Username' })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุรหัสผ่าน' })
  password!: string;
}