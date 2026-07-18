// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string; // เก็บรหัสผ่านที่ผ่านการเข้ารหัส (Hash) แล้วเท่านั้น

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['Admin', 'Lecturer', 'Staff'], default: 'Staff' })
  role!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);