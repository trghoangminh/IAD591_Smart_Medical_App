import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from main import SessionLocal, UserDB, PrescriptionDB, ScheduleDB, MedicationLogDB, NotificationDB, engine, Base

# Drop và Recreate toàn bộ CSDL
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_perfect_demo():
    print("🧹 Đang dọn dẹp và thiết lập Dữ Liệu Lớn (Big Data) để Test...")
    db: Session = SessionLocal()
    
    # --- 1. USERS ---
    doc1 = UserDB(name="BS. Tr Minh", role="doctor", password="123", phone="0945036565", email="trghoangminh@gmail.com")
    doc2 = UserDB(name="BS. Lê Hùng", role="doctor", password="123", phone="0988888888", email="hung@gmail.com")
    family = UserDB(name="Chị Lan", role="family", password="123", phone="0888888888", email="family@smartmed.com")
    
    db.add_all([doc1, doc2, family])
    db.commit()
    
    p1 = UserDB(name="Ông Nội", role="patient", password="123", phone="0819945931", email="quocanh@gmail.com", caretaker_id=doc1.id)
    p2 = UserDB(name="Bà Ngoại", role="patient", password="123", phone="0822222222", email="hieubeo@gmail.com", caretaker_id=doc1.id)
    p3 = UserDB(name="Bé Bún", role="patient", password="123", phone="0833333333", email="bun@smartmed.com", caretaker_id=doc2.id)
    
    db.add_all([p1, p2, p3])
    db.commit()

    # --- 2. PRESCRIPTIONS & SCHEDULES ---
    now = datetime.now()
    
    # Đơn 1: Kéo dài 1 năm (Thuốc duy trì tim mạch - Ông Nội)
    rx1 = PrescriptionDB(user_id=p1.id, medicine="Amlodipine (Huyết Áp)", dosage=1, start_date="2024-01-01", end_date="2025-12-31")
    db.add(rx1)
    db.commit()
    sch1 = ScheduleDB(prescription_id=rx1.id, time="08:00", status="taken")
    db.add(sch1)

    # Đơn 2: Vitamin C - Ông Nội
    rx2 = PrescriptionDB(user_id=p1.id, medicine="Vitamin C", dosage=2, start_date="2024-01-01", end_date="2025-12-31")
    db.add(rx2)
    db.commit()
    sch2_a = ScheduleDB(prescription_id=rx2.id, time="09:00", status="taken")
    sch2_b = ScheduleDB(prescription_id=rx2.id, time="20:00", status="pending")
    db.add_all([sch2_a, sch2_b])

    # Đơn 3: Thuốc ho - Bà Ngoại
    rx3 = PrescriptionDB(user_id=p2.id, medicine="Siro Ho Prospan", dosage=1, start_date="2024-04-01", end_date="2024-04-30")
    db.add(rx3)
    db.commit()
    db.add(ScheduleDB(prescription_id=rx3.id, time="12:00", status="taken"))

    # Đơn 4: Kháng sinh - Bé Bún
    rx4 = PrescriptionDB(user_id=p3.id, medicine="Augmentin", dosage=1, start_date="2024-04-10", end_date="2024-04-17")
    db.add(rx4)
    db.commit()
    db.add(ScheduleDB(prescription_id=rx4.id, time="08:30", status="taken"))

    db.commit()

    # --- 3. MEDICAL LOGS (Báo cáo Tuân thủ 14 ngày qua cho Ông Nội) ---
    print("📈 Đang phát sinh biểu đồ lịch sử 14 ngày...")
    for i in range(14, 0, -1):
        test_date = datetime.utcnow() - timedelta(days=i)
        
        # Sáng 8:00: Lúc nhớ lúc quên
        status_s1 = "taken" if random.random() > 0.2 else "missed"
        db.add(MedicationLogDB(user_id=p1.id, schedule_id=sch1.id, medicine="Amlodipine", 
                               scheduled_time="08:00", status=status_s1, timestamp=test_date.replace(hour=1, minute=0)))
        
        # Sáng 9:00: Vitamin C 100% uống
        db.add(MedicationLogDB(user_id=p1.id, schedule_id=sch2_a.id, medicine="Vitamin C", 
                               scheduled_time="09:00", status="taken", timestamp=test_date.replace(hour=2, minute=0)))
    db.commit()

    # --- 4. TELEGRAM SOS DEMO ---
    demo_time = (now + timedelta(minutes=2)).strftime("%H:%M")
    rx_demo = PrescriptionDB(user_id=p1.id, medicine="Thuốc Đau Bụng Cấp", dosage=2, start_date="2024-01-01", end_date="2025-01-01")
    db.add(rx_demo)
    db.commit()
    
    demo_schedule = ScheduleDB(prescription_id=rx_demo.id, time=demo_time, status="pending", sms_reminder_sent=0, sms_missed_sent=0)
    db.add(demo_schedule)
    db.commit()
    
    # Thêm vài Notification cũ cho có bảng liệt kê
    db.add(NotificationDB(user_id=doc1.id, message="Bệnh nhân Ông Nội báo cáo mệt mỏi.", is_read=True, timestamp=datetime.utcnow() - timedelta(hours=5)))
    db.add(NotificationDB(user_id=p1.id, message="Chào mừng đến với SmartMed!", is_read=True, timestamp=datetime.utcnow() - timedelta(days=5)))
    db.commit()

    db.close()
    
    print("=========================================================")
    print("✅ ĐÃ CHÈN DỮ LIỆU ĐA DẠNG THÀNH CÔNG! ✅")
    print(f"👉 Điểm rơi CẢNH BÁO sẽ nổ vào đúng lúc: {demo_time} (Hãy theo dõi màn hình Telegram)")
    print("ĐĂNG NHẬP:")
    print("- Bệnh nhân 1 (Ông Nội): 0819945931 / 123 (Nhiều Data Report Nhất)")
    print("- Bệnh nhân 2 (Bà Ngoại): 0822222222 / 123")
    print("- Bác sĩ 1 (BS Trần Minh): 0999999999 / 123 (Có 2 bệnh nhân)")
    print("=========================================================")

if __name__ == "__main__":
    seed_perfect_demo()
