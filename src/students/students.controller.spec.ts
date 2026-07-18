import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student, StudentSchema } from './schemas/student.schema';

describe('StudentsController', () => {
  let controller: StudentsController;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        // 🔌 เชื่อมต่อตรงเข้ากับฐานข้อมูลจริงบนเครื่องคอมพิวเตอร์ของคุณ
        MongooseModule.forRoot('mongodb://Kuriya:K1110201292049_@localhost:27017/shop?authSource=admin'),
        // 💡 ลงทะเบียนโมเดลจริงเข้าสู่สภาพแวดล้อมการทดสอบ
        MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }]),
      ],
      controllers: [StudentsController],
      providers: [StudentsService],
    }).compile();

    controller = moduleRef.get<StudentsController>(StudentsController);
  });

  // ปิดการเชื่อมต่อฐานข้อมูลหลังจากรันการทดสอบเสร็จสิ้นเพื่อคืนความจำให้ระบบ
  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});