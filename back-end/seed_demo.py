import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from main import SessionLocal, UserDB, PrescriptionDB, ScheduleDB, MedicationLogDB, NotificationDB, engine, Base

# Drop và Recreate toàn bộ CSDL
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_perfect_demo():
    print("🧹 Đang dọn dẹp và thiết lập Dữ Liệu Demo...")
    db: Session = SessionLocal()

    # --- 1. USERS ---
    doc1 = UserDB(name="BS. Tr Minh", role="doctor", password="123",
                  phone="0945036565", email="trghoangminh@gmail.com",
                  birth_date="1980-05-15", gender="male")
    doc2 = UserDB(name="BS. Lê Hùng", role="doctor", password="123",
                  phone="0988888888", email="hung@gmail.com",
                  birth_date="1975-08-20", gender="male")
    family = UserDB(name="Chị Lan", role="family", password="123",
                    phone="0888888888", email="family@smartmed.com",
                    birth_date="1985-03-10", gender="female")

    db.add_all([doc1, doc2, family])
    db.commit()

    # Bệnh nhân có đầy đủ demographics
    p1 = UserDB(name="Ông Nội", role="patient", password="123",
                phone="0819945931", email="quocanh@gmail.com",
                caretaker_id=doc1.id, birth_date="1948-05-10", gender="male")
    p2 = UserDB(name="Bà Ngoại", role="patient", password="123",
                phone="0822222222", email="hieubeo@gmail.com",
                caretaker_id=doc1.id, birth_date="1952-08-20", gender="female")
    p3 = UserDB(name="Bé Bún", role="patient", password="123",
                phone="0833333333", email="bun@smartmed.com",
                caretaker_id=doc2.id, birth_date="2015-03-15", gender="female")

    db.add_all([p1, p2, p3])
    db.commit()

    # --- 2. PRESCRIPTIONS & SCHEDULES ---
    now = datetime.now()

    # Đơn 1: Amlodipine - Ông Nội (tim mạch)
    rx1 = PrescriptionDB(user_id=p1.id, medicine="Amlodipine", dosage=1,
                         start_date="2024-01-01", end_date="2026-12-31")
    db.add(rx1)
    db.commit()
    sch1 = ScheduleDB(prescription_id=rx1.id, time="08:00", status="taken")
    db.add(sch1)

    # Đơn 2: Metformin - Ông Nội (tiểu đường)
    rx2 = PrescriptionDB(user_id=p1.id, medicine="Metformin", dosage=2,
                         start_date="2024-01-01", end_date="2026-12-31")
    db.add(rx2)
    db.commit()
    sch2_a = ScheduleDB(prescription_id=rx2.id, time="09:00", status="taken")
    sch2_b = ScheduleDB(prescription_id=rx2.id, time="20:00", status="pending")
    db.add_all([sch2_a, sch2_b])

    # Đơn 3: Atorvastatin - Bà Ngoại (mỡ máu)
    rx3 = PrescriptionDB(user_id=p2.id, medicine="Atorvastatin", dosage=1,
                         start_date="2024-06-01", end_date="2026-12-31")
    db.add(rx3)
    db.commit()
    sch3 = ScheduleDB(prescription_id=rx3.id, time="21:00", status="taken")
    db.add(sch3)

    # Đơn 4: Augmentin - Bé Bún (kháng sinh)
    rx4 = PrescriptionDB(user_id=p3.id, medicine="Augmentin", dosage=1,
                         start_date="2026-04-08", end_date="2026-04-22")
    db.add(rx4)
    db.commit()
    sch4 = ScheduleDB(prescription_id=rx4.id, time="08:30", status="taken")
    db.add(sch4)

    db.commit()

    # --- 3. MEDICAL LOGS (45 ngày - Ông Nội) ---
    print("📈 Đang phát sinh lịch sử 45 ngày cho Ông Nội...")
    for i in range(45, 0, -1):
        test_date = datetime.utcnow() - timedelta(days=i)

        # Amlodipine 08:00: lúc nhớ lúc quên (~15% missed, cuối tuần quên hơn)
        is_weekend = test_date.weekday() >= 5
        miss_chance = 0.30 if is_weekend else 0.12
        status_s1 = "missed" if random.random() < miss_chance else "taken"
        db.add(MedicationLogDB(
            user_id=p1.id, schedule_id=sch1.id, medicine="Amlodipine",
            scheduled_time="08:00", status=status_s1,
            timestamp=test_date.replace(hour=8, minute=0, second=0)
        ))

        # Metformin 09:00: tuân thủ tốt (~8% missed)
        status_s2a = "missed" if random.random() < 0.08 else "taken"
        db.add(MedicationLogDB(
            user_id=p1.id, schedule_id=sch2_a.id, medicine="Metformin",
            scheduled_time="09:00", status=status_s2a,
            timestamp=test_date.replace(hour=9, minute=0, second=0)
        ))

        # Metformin 20:00: hay quên buổi tối (~25% missed)
        if i > 7:  # 7 ngày gần nhất tệ hơn
            status_s2b = "missed" if random.random() < 0.25 else "taken"
        else:
            status_s2b = "missed" if random.random() < 0.45 else "taken"
        db.add(MedicationLogDB(
            user_id=p1.id, schedule_id=sch2_b.id, medicine="Metformin",
            scheduled_time="20:00", status=status_s2b,
            timestamp=test_date.replace(hour=20, minute=0, second=0)
        ))

    db.commit()

    # --- 4. MEDICAL LOGS (30 ngày - Bà Ngoại) ---
    print("📈 Đang phát sinh lịch sử 30 ngày cho Bà Ngoại...")
    for i in range(30, 0, -1):
        test_date = datetime.utcnow() - timedelta(days=i)
        status_p2 = "missed" if random.random() < 0.20 else "taken"
        db.add(MedicationLogDB(
            user_id=p2.id, schedule_id=sch3.id, medicine="Atorvastatin",
            scheduled_time="21:00", status=status_p2,
            timestamp=test_date.replace(hour=21, minute=0, second=0)
        ))
    db.commit()

    # --- 5. MEDICAL LOGS (7 ngày - Bé Bún) ---
    print("📈 Đang phát sinh lịch sử 7 ngày cho Bé Bún...")
    for i in range(7, 0, -1):
        test_date = datetime.utcnow() - timedelta(days=i)
        status_p3 = "missed" if random.random() < 0.10 else "taken"
        db.add(MedicationLogDB(
            user_id=p3.id, schedule_id=sch4.id, medicine="Augmentin",
            scheduled_time="08:30", status=status_p3,
            timestamp=test_date.replace(hour=8, minute=30, second=0)
        ))
    db.commit()

    # --- 6. TELEGRAM SOS DEMO ---
    demo_time = (now + timedelta(minutes=2)).strftime("%H:%M")
    rx_demo = PrescriptionDB(user_id=p1.id, medicine="Thuốc Đau Bụng Cấp", dosage=2,
                              start_date="2024-01-01", end_date="2025-01-01")
    db.add(rx_demo)
    db.commit()

    demo_schedule = ScheduleDB(prescription_id=rx_demo.id, time=demo_time,
                                status="pending", sms_reminder_sent=0, sms_missed_sent=0)
    db.add(demo_schedule)
    db.commit()

    # Notifications
    db.add(NotificationDB(user_id=doc1.id, message="Bệnh nhân Ông Nội báo cáo mệt mỏi.",
                           is_read=True, timestamp=datetime.utcnow() - timedelta(hours=5)))
    db.add(NotificationDB(user_id=p1.id, message="Chào mừng đến với SmartMed!",
                           is_read=True, timestamp=datetime.utcnow() - timedelta(days=5)))
    db.commit()
    db.close()

    print("=========================================================")
    print("✅ ĐÃ CHÈN DỮ LIỆU DEMO THÀNH CÔNG!")
    print(f"👉 CẢNH BÁO sẽ nổ vào lúc: {demo_time}")
    print("ĐĂNG NHẬP:")
    print("- Ông Nội (patient): 0819945931 / 123  — 45 ngày log")
    print("- Bà Ngoại (patient): 0822222222 / 123 — 30 ngày log")
    print("- Bé Bún (patient): 0833333333 / 123   — 7 ngày log")
    print("- BS. Trần Minh (doctor): 0945036565 / 123")
    print("=========================================================")

if __name__ == "__main__":
    seed_perfect_demo()
