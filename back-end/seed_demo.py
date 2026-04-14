import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from main import SessionLocal, UserDB, PrescriptionDB, ScheduleDB, MedicationLogDB, NotificationDB, engine, Base

# Drop (Xoá sạch sành sanh) và Recreate (Tạo lại từ đầu) toàn bộ các bảng trong CSDL
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_perfect_demo():
    print("🧹 Đang dọn dẹp và thiết lập dữ liệu Demo hoàn hảo...")
    db: Session = SessionLocal()
    
    # 1. Tạo Users đầy đủ vai vế để chứng minh Data có sự liên kết chuẩn mực
    doctor = UserDB(name="BS. Trần Minh", role="doctor", password="123", phone="0999999999", email="doctor@smartmed.com")
    family = UserDB(name="Chị Linh (Con ruột)", role="family", password="123", phone="0888888888", email="family@smartmed.com")
    db.add(doctor)
    db.add(family)
    db.commit()
    
    # Bệnh nhân cài người quản lý (Caretaker) là Bác sĩ Trần Minh để vinh quy bái tổ cái luồng lố giờ
    patient = UserDB(name="Ông Nội", role="patient", password="123", phone="0819945931", email="patient@smartmed.com", caretaker_id=doctor.id)
    db.add(patient)
    db.commit()

    # 2. Tạo đơn thuốc quá khứ (Đã uống để đẹp UI màn hình chính và Biểu đồ)
    past_rx = PrescriptionDB(user_id=patient.id, medicine="Vitamin C", dosage=1, start_date="2024-01-01", end_date="2025-01-01")
    db.add(past_rx)
    db.commit()
    
    past_schedule = ScheduleDB(prescription_id=past_rx.id, time="08:00", status="taken", sms_reminder_sent=1, sms_missed_sent=1)
    db.add(past_schedule)
    db.commit()

    # Khởi tạo Log Lịch sử để vào tab Biểu Đồ (Analytics) nhìn có dữ liệu đẹp
    db.add(MedicationLogDB(user_id=patient.id, schedule_id=past_schedule.id, medicine="Vitamin C", scheduled_time="08:00", status="taken", timestamp=datetime.utcnow() - timedelta(days=1)))
    db.add(MedicationLogDB(user_id=patient.id, schedule_id=past_schedule.id, medicine="Vitamin C", scheduled_time="08:00", status="taken", timestamp=datetime.utcnow() - timedelta(days=2)))
    
    # 3. TIẾT MỤC CHÍNH BÁO CÁO: Thuốc chuẩn bị nổ giờ (Cách hiện tại đúng 2 phút)
    now = datetime.now()
    demo_time = (now + timedelta(minutes=2)).strftime("%H:%M")
    
    demo_rx = PrescriptionDB(user_id=patient.id, medicine="Thuốc Tim Mạch Cấp Tốc", dosage=2, start_date="2024-01-01", end_date="2025-01-01")
    db.add(demo_rx)
    db.commit()
    
    demo_schedule = ScheduleDB(prescription_id=demo_rx.id, time=demo_time, status="pending", sms_reminder_sent=0, sms_missed_sent=0)
    db.add(demo_schedule)
    
    # 4. Thuốc dự bị tương lai để Trang chủ nhìn nó đầy đặn chuyên nghiệp
    future_time_1 = (now + timedelta(hours=4)).strftime("%H:%M")
    future_rx_1 = PrescriptionDB(user_id=patient.id, medicine="Paracetamol", dosage=1, start_date="2024-01-01", end_date="2025-01-01")
    db.add(future_rx_1)
    db.commit()
    db.add(ScheduleDB(prescription_id=future_rx_1.id, time=future_time_1, status="pending", sms_reminder_sent=0, sms_missed_sent=0))

    db.commit()
    db.close()
    
    print("=========================================================")
    print("🎯 DỮ LIỆU DEMO BÁO CÁO GIỮA KỲ ĐÃ SẴN SÀNG! 🎯")
    print(f"👉 Tài khoản đăng nhập App: 0819945931 / Mật khẩu: 123")
    print(f"👉 Điểm rơi CẢNH BÁO sẽ nổ vào đúng lúc: {demo_time} (Đếm ngược 2 phút)")
    print("=========================================================")

if __name__ == "__main__":
    seed_perfect_demo()
