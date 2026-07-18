import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { Lecturer, LecturerSchema } from './schemas/lecturer.schema';

describe('LecturersController', () => {
  let controller: LecturersController;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        // 🔌 เชื่อมต่อตรงเข้ากับฐานข้อมูลจริงบนเครื่องคอมพิวเตอร์ของคุณ
        MongooseModule.forRoot('mongodb://Kuriya:K1110201292049_@localhost:27017/shop?authSource=admin'),
        // 💡 ลงทะเบียนโมเดลจริงเข้าสู่สภาพแวดล้อมการทดสอบ
        MongooseModule.forFeature([{ name: Lecturer.name, schema: LecturerSchema }]),
      ],
      controllers: [LecturersController],
      providers: [LecturersService],
    }).compile();

    controller = moduleRef.get<LecturersController>(LecturersController);
  });

  // ปิดการเชื่อมต่อฐานข้อมูลหลังจากรันการทดสอบเสร็จสิ้น
  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});