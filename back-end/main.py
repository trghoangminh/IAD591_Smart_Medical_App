import re
from datetime import datetime, timedelta, date
from typing import Generator, List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker
import requests
import os
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
import threading
import json



load_dotenv()

import urllib.request
import json

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8634667672:AAEtiE5bMt52NrCBrJ1MB_7UHH5-G_b0kVE")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "8569010173")

def send_notification(push_token: str, title: str, body: str):
    print(f"[ALARM] {title}: {body}")
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = json.dumps({
            "chat_id": TELEGRAM_CHAT_ID, 
            "text": body,
            "parse_mode": "Markdown"
        }).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print("Lỗi Telegram:", e)

# =========================
# DATABASE CONFIG
# =========================
DATABASE_URL = "sqlite:///./smart_medicine.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # cần cho SQLite + FastAPI
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# =========================
# DATABASE MODELS
# =========================
class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # patient / doctor / family
    password = Column(String, nullable=False)
    phone = Column(String, nullable=True, unique=True)
    email = Column(String, nullable=True, unique=True)
    caretaker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    push_token = Column(String, nullable=True) # Cột lưu mã máy điện thoại

    prescriptions = relationship("PrescriptionDB", back_populates="user")
    logs = relationship("MedicationLogDB", back_populates="user")
    notifications = relationship("NotificationDB", back_populates="user")

    birth_date = Column(String, nullable=True) 
    gender = Column(String, nullable=True) 


class PrescriptionDB(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine = Column(String, nullable=False)
    dosage = Column(Integer, nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)

    user = relationship("UserDB", back_populates="prescriptions")
    schedules = relationship("ScheduleDB", back_populates="prescription")


class ScheduleDB(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    time = Column(String, nullable=False)  # ví dụ: "08:00"
    status = Column(String, default="pending", nullable=False)  # pending / taken / missed
    sms_reminder_sent = Column(Integer, default=0)
    sms_missed_sent = Column(Integer, default=0)

    prescription = relationship("PrescriptionDB", back_populates="schedules")
    logs = relationship("MedicationLogDB", back_populates="schedule")


class MedicationLogDB(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    medicine = Column(String, nullable=False)
    scheduled_time = Column(String, nullable=False)
    status = Column(String, nullable=False)  # taken / missed
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="logs")
    schedule = relationship("ScheduleDB", back_populates="logs")


class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="notifications")


# Tạo database + bảng
Base.metadata.create_all(bind=engine)


# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Smart Medicine Backend")
# config HiveMQ
MQTT_BROKER = "e2ff4c4614e54fec99e240de636f03eb.s1.eu.hivemq.cloud"
MQTT_PORT = 1883
MQTT_USER = "admin"
MQTT_PASS = "Admin@123"

TOPIC_CONFIRM = "smart_cabinet/device/confirm"
TOPIC_DISPENSE = "smart_cabinet/device/dispense"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT CONNECTED TO HIVEMQ!")
        client.subscribe(TOPIC_CONFIRM)
        print(f"📡 Subscribed to: {TOPIC_CONFIRM}")
    else:
        print("❌ MQTT CONNECTION FAILED, code:", rc)

def on_message(client, userdata, msg):
    print("\n📩 MQTT MESSAGE RECEIVED")
    print("Topic:", msg.topic)
    print("Payload:", msg.payload.decode())

    # test parse JSON
    try:
        data = json.loads(msg.payload.decode())
        print("Parsed JSON:", data)
    except:
        print("⚠️ Not a JSON message")

def start_mqtt():
    client = mqtt.Client()

    client.username_pw_set(MQTT_USER, MQTT_PASS)

    # 👇 QUAN TRỌNG
    client.tls_set()

    client.on_connect = on_connect
    client.on_message = on_message

    print("🔄 Connecting to MQTT broker...")
    client.connect(MQTT_BROKER, 8883, 60)

    client.loop_forever()

# chạy MQTT ở background
threading.Thread(target=start_mqtt, daemon=True).start()

# Cho phép Web App và thiết bị ngoại vi gọi API mà không bị lỗi CORS (Blocked by CORS policy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# DB DEPENDENCY
# =========================
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# Pydantic SCHEMAS
# =========================
class RegisterRequest(BaseModel):
    name: str = Field(..., example="Nguyen Van A")
    role: Literal["patient", "doctor", "family"] = "patient"
    password: str = Field(..., example="123456")
    phone: Optional[str] = Field(default=None, example="0987654321")
    email: Optional[str] = Field(default=None, example="abc@example.com")
    caretaker_id: Optional[int] = Field(default=None, example=2)
    birth_date: Optional[str] = Field(default=None, example="1990-01-15")
    gender: Optional[Literal["male", "female", "other"]] = Field(default=None)

class LoginRequest(BaseModel):
    username: str = Field(..., description="Phone number or Email", example="0987654321")
    password: str = Field(..., example="123456")

class PushTokenUpdate(BaseModel):
    user_id: int
    push_token: str

class PrescriptionCreate(BaseModel):
    user_id: int = Field(..., example=1)
    medicine: str = Field(..., example="Paracetamol")
    dosage: int = Field(..., example=2)
    times: List[str] = Field(..., example=["08:00", "20:00"])
    start_date: Optional[str] = Field(default=None, example="2026-04-12")
    end_date: Optional[str] = Field(default=None, example="2026-04-20")

class ConfirmRequest(BaseModel):
    user_id: int = Field(..., example=1)
    medicine: str = Field(..., example="Paracetamol")
    time: str = Field(..., example="08:00")


#Nhận message
def on_message(client, userdata, msg):
    print("\n📩 MQTT MESSAGE RECEIVED")
    print("Topic:", msg.topic)
    print("Payload:", msg.payload.decode())

    db = SessionLocal()

    try:
        data = json.loads(msg.payload.decode())

        schedule_id = data.get("schedule_id")
        status = data.get("status")

        if not schedule_id:
            print("❌ Missing schedule_id")
            return

        # 🔍 tìm schedule theo id
        schedule = db.query(ScheduleDB).filter(ScheduleDB.id == schedule_id).first()

        if not schedule:
            print(f"❌ Schedule {schedule_id} not found")
            return

        # ❗ tránh update lại nhiều lần
        if schedule.status != "pending":
            print(f"⚠️ Schedule {schedule_id} already processed")
            return

        # 🎯 xử lý trạng thái
        if status == "CONFIRMED_TAKEN":
            schedule.status = "taken"
            log_status = "taken"

        elif status == "MISSED_TIMEOUT":
            schedule.status = "missed"
            log_status = "missed"

        else:
            print("❌ Unknown status")
            return

        # 🔗 lấy prescription để log
        prescription = db.query(PrescriptionDB).filter(
            PrescriptionDB.id == schedule.prescription_id
        ).first()

        # 📝 lưu log
        log = MedicationLogDB(
            user_id=prescription.user_id,
            schedule_id=schedule.id,
            medicine=prescription.medicine,
            scheduled_time=schedule.time,
            status=log_status,
            timestamp=datetime.utcnow(),
        )

        db.add(log)
        db.commit()

        print(f"✅ Updated schedule {schedule_id} → {log_status}")

    except Exception as e:
        print("❌ MQTT ERROR:", e)

    finally:
        db.close()

# =========================
# API 1: AUTHENTICATION
# =========================
@app.post("/api/auth/register")
def register(user: RegisterRequest, db: Session = Depends(get_db)):
    if user.phone:
        if db.query(UserDB).filter(UserDB.phone == user.phone).first():
            raise HTTPException(status_code=400, detail="Phone already registered")
    if user.email:
        if db.query(UserDB).filter(UserDB.email == user.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserDB(
        name=user.name,
        role=user.role,
        password=user.password,
        phone=user.phone,
        email=user.email,
        caretaker_id=user.caretaker_id,
        birth_date=user.birth_date,
        gender=user.gender,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Register success",
        "user_id": new_user.id,
        "role": new_user.role
    }

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(
        ((UserDB.phone == req.username) | (UserDB.email == req.username)) &
        (UserDB.password == req.password)
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login success",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "phone": user.phone,
            "email": user.email,
            "caretaker_id": user.caretaker_id,
            "push_token": user.push_token
        },
    }

@app.post("/api/users/push-token")
def update_push_token(data: PushTokenUpdate, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.id == data.user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.push_token = data.push_token
    db.commit()
    return {"status": "success"}

@app.get("/api/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id,
        "name": u.name,
        "role": u.role,
        "phone": u.phone,
        "email": u.email,
        "caretaker_id": u.caretaker_id
    }

@app.get("/api/doctor/{doctor_id}/patients")
def get_patients(doctor_id: int, db: Session = Depends(get_db)):
    # Bệnh nhân của bác sĩ là user do bác sĩ chăm sóc
    patients = db.query(UserDB).filter(UserDB.caretaker_id == doctor_id).all()
    # Để Dashboard thêm trực quan, có thể tính toán số lượng thuốc đã uống vs chưa uống cho mỗi bệnh nhân (Adherence rate)
    # Tuy nhiên vì thời gian MVP, ta trả thông tin cơ bản kèm adherence rate tĩnh
    results = []
    for p in patients:
        taken = db.query(MedicationLogDB).filter(
            MedicationLogDB.user_id == p.id,
            MedicationLogDB.status == "taken"
        ).count()
        missed = db.query(MedicationLogDB).filter(
            MedicationLogDB.user_id == p.id,
            MedicationLogDB.status == "missed"
        ).count()
        total_logs = taken + missed
        adherence = round((taken / total_logs * 100) if total_logs > 0 else 100)
        
        prescriptions_db = db.query(PrescriptionDB).filter(PrescriptionDB.user_id == p.id).all()
        prescriptions_list = []
        for pres in prescriptions_db:
            pres_schedules = [s.time for s in pres.schedules]
            prescriptions_list.append({
                "id": pres.id,
                "medicine": pres.medicine,
                "dosage": pres.dosage,
                "times": pres_schedules
            })

        results.append({
            "id": p.id,
            "name": p.name,
            "phone": p.phone or "Trống",
            "email": p.email or "Trống",
            "adherence_rate": adherence,
            "prescriptions_count": len(prescriptions_list),
            "prescriptions": prescriptions_list
        })
    return results

# =========================
# API 2: CREATE PRESCRIPTION
# =========================
@app.post("/api/prescriptions")
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prescription = PrescriptionDB(
        user_id=payload.user_id,
        medicine=payload.medicine,
        dosage=payload.dosage,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    created_schedules = []
    for t in payload.times:
        schedule = ScheduleDB(
            prescription_id=prescription.id,
            time=t,
            status="pending",
        )
        db.add(schedule)
        created_schedules.append(t)

    db.commit()

    # Thêm thông báo
    notif_msg = f"Đơn thuốc mới: {prescription.medicine} ({len(created_schedules)} lần/ngày) đã được thêm vào lịch uống của bạn."
    notif = NotificationDB(
        user_id=payload.user_id,
        message=notif_msg
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Prescription created successfully",
        "prescription_id": prescription.id,
        "medicine": prescription.medicine,
        "dosage": prescription.dosage,
        "times": created_schedules,
    }


# =========================
# API 3: GET SCHEDULE
# =========================
@app.get("/api/schedule/{user_id}")
def get_schedule(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    schedules = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(PrescriptionDB.user_id == user_id)
        .all()
    )

    result = []
    for schedule, prescription in schedules:
        result.append(
            {
                "schedule_id": schedule.id,
                "medicine": prescription.medicine,
                "dosage": prescription.dosage,
                "time": schedule.time,
                "status": schedule.status,
            }
        )

    return result

# =========================
# API 3: GET NEXT DOSE FOR DEVICE
# =========================
@app.get("/api/device/next-dose/{user_id}")
def get_next_dose(user_id: int, db: Session = Depends(get_db)):
    now = datetime.now().strftime("%H:%M")

    # tìm schedule gần nhất chưa uống
    record = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(PrescriptionDB.user_id == user_id)
        .filter(ScheduleDB.status == "pending")
        .order_by(ScheduleDB.time)
        .first()
    )

    if not record:
        return {"message": "No medicine to take now"}

    schedule, prescription = record

    return {
        "medicineName": prescription.medicine,
        "quantity": prescription.dosage
    }

# Send mesage to MQTT
def send_mqtt_dispense(schedule_id, medicine, quantity):
    client = mqtt.Client()
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.tls_set()
    client.connect(MQTT_BROKER, 8883, 60)

    client.loop_start()

    data = {
        "schedule_id": schedule_id,
        "medicineName": medicine,
        "quantity": quantity
    }

    result = client.publish(TOPIC_DISPENSE, json.dumps(data))
    result.wait_for_publish()

    client.loop_stop()
    client.disconnect()

# =========================
# API 4: DEVICE CONFIRM
# =========================
@app.post("/api/device/confirm")
def confirm_medicine(payload: ConfirmRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(PrescriptionDB.user_id == payload.user_id)
        .filter(PrescriptionDB.medicine == payload.medicine)
        .filter(ScheduleDB.time == payload.time)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule, prescription = record
    
    if schedule.status == "taken":
        return {"message": "Already taken", "status": "taken"}

    schedule.status = "taken"

    log = MedicationLogDB(
        user_id=payload.user_id,
        schedule_id=schedule.id,
        medicine=payload.medicine,
        scheduled_time=payload.time,
        status="taken",
        timestamp=datetime.utcnow(),
    )
    db.add(log)
    db.commit()

    return {
        "message": "Medicine confirmed successfully",
        "user_id": payload.user_id,
        "medicine": payload.medicine,
        "time": payload.time,
        "status": "taken",
    }


# =========================
# API 5: CHECK MISSED SCHEDULES (Cron/Job)
# =========================
@app.post("/api/cron/check-missed-schedules")
def check_missed_schedules(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    now = datetime.now() # Căn chuẩn giờ địa phương hiện tại
    current_time_str = now.strftime("%H:%M") 
    
    schedules = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(ScheduleDB.status == "pending")
        .all()
    )  

    missed_count = 0
    reminders_count = 0
    
    for schedule, prescription in schedules:
        try:
            scheduled_datetime = datetime.strptime(schedule.time, "%H:%M")
            now_datetime = datetime.strptime(current_time_str, "%H:%M")
            diff_minutes = (now_datetime - scheduled_datetime).total_seconds() / 60
            print(diff_minutes)
            
            patient = db.query(UserDB).filter(UserDB.id == prescription.user_id).first()
            
            # 1. NHẮC TRƯỚC GIỜ (Dành cho Demo): Sớm hơn 5 phút so với giờ uống
            if -5 <= diff_minutes <= 0:            
                send_mqtt_dispense(schedule.id, prescription.medicine, prescription.dosage)
                print("📤 Sent MQTT to ESP32")
                if schedule.sms_reminder_sent == 0:
                    if patient and patient.push_token:
                        msg = f"[SmartMed] Sap den gio uong thuoc {prescription.medicine} luc {schedule.time}. Vui long chuan bi nuoc!"
                        background_tasks.add_task(send_notification, patient.push_token, "Đến giờ uống thuốc", msg)
                    schedule.sms_reminder_sent = 1
                    reminders_count += 1
            
            # 2. KHẨN CẤP QUÁ GIỜ (Dành cho Demo): Chỉ cần trễ qua 2 phút -> Ghi án phạt Missed
            if diff_minutes > 2: 
                schedule.status = "missed"
                missed_count += 1
                
                log = MedicationLogDB(
                    user_id=prescription.user_id,
                    schedule_id=schedule.id,
                    medicine=prescription.medicine,
                    scheduled_time=schedule.time,
                    status="missed",
                    timestamp=datetime.utcnow(),
                )
                db.add(log)
                
                if patient:
                    # Gửi App Push ảo cho bệnh nhân
                    notif_patient = NotificationDB(
                        user_id=patient.id,
                        message=f"Bạn đã quên uống {prescription.medicine} theo lịch lúc {schedule.time}."
                    )
                    db.add(notif_patient)
                    
                    # Truy lùng Bác Sĩ / Người nhà để bắt đền
                    if patient.caretaker_id:
                        notif_caretaker = NotificationDB(
                            user_id=patient.caretaker_id,
                            message=f"Bệnh nhân {patient.name} đã bỏ lỡ liều {prescription.medicine} lúc {schedule.time}."
                        )
                        db.add(notif_caretaker)
                        
                        # BẮN SMS CẤP CỨU CHO BÁC SĨ (Chỉ bắn 1 lần)
                        if schedule.sms_missed_sent == 0:
                            caretaker = db.query(UserDB).filter(UserDB.id == patient.caretaker_id).first()
                            
                            # Fallback: Tránh lỗi trùng SDT làm hỏng Database, 
                            # Cứ gửi thẳng về SDT của Bệnh nhân để test nếu Doctor trống SDT!
                            doctor_token = caretaker.push_token if caretaker and caretaker.push_token else patient.push_token
                            
                            # Cho phép Push Telegram khẩn cấp dù người dùng thiếu Token thiết bị
                            msg_sos_body = f"""🚨 *BÁO ĐỘNG QUÊN THUỐC* 🚨

Hệ thống y tế SmartMed ghi nhận bệnh nhân đã bỏ lỡ lịch uống thuốc. Bác sĩ hoặc người nhà vui lòng liên hệ ngay để đôn đốc nhé!

👤 **Bệnh nhân:** {patient.name}
💊 **Loại thuốc:** {prescription.medicine}
⏰ **Giờ lên lịch:** {schedule.time}
⚠️ **Trạng thái:** Quá hạn báo động"""
                            background_tasks.add_task(send_notification, doctor_token or "telegram", "🚨 CẢNH BÁO QUÊN THUỐC", msg_sos_body)
                            
                            schedule.sms_missed_sent = 1

        except Exception as e:
            pass 

    db.commit()
    return {"message": "Cronjob Done", "missed": missed_count, "reminders_sent": reminders_count}


# =========================
# API 6: GET NOTIFICATIONS
# =========================
@app.get("/api/notifications/{user_id}")
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    notifs = db.query(NotificationDB).filter(NotificationDB.user_id == user_id).order_by(NotificationDB.timestamp.desc()).all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "timestamp": n.timestamp.isoformat()
        } for n in notifs
    ]


# =========================
# API 7: HISTORY
# =========================
@app.get("/api/history/{user_id}")
def get_history(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logs = (
        db.query(MedicationLogDB)
        .filter(MedicationLogDB.user_id == user_id)
        .order_by(MedicationLogDB.timestamp.desc())
        .all()
    )

    return [
        {
            "log_id": log.id,
            "medicine": log.medicine,
            "scheduled_time": log.scheduled_time,
            "status": log.status,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


# =========================
# API 8: ANALYTICS
# =========================
@app.get("/api/analytics/{user_id}")
def analytics(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_schedules = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(PrescriptionDB.user_id == user_id)
        .count()
    )

    taken_count = (
        db.query(MedicationLogDB)
        .filter(MedicationLogDB.user_id == user_id)
        .filter(MedicationLogDB.status == "taken")
        .count()
    )

    missed_count = (
        db.query(MedicationLogDB)
        .filter(MedicationLogDB.user_id == user_id)
        .filter(MedicationLogDB.status == "missed")
        .count()
    )

    total_historical_logs = taken_count + missed_count
    adherence_rate = (taken_count / total_historical_logs * 100) if total_historical_logs > 0 else 0

    return {
        "user_id": user_id,
        "total_schedules": total_schedules,
        "taken": taken_count,
        "missed": missed_count,
        "adherence_rate": round(adherence_rate, 2),
    }


# =========================
# API 9: ML FEATURES FOR AI SERVICE
# =========================

# Bảng map tên thuốc tiếng Việt/ngoặc → tên chuẩn ML
_MEDICINE_CANONICAL: dict[str, str] = {
    "amlodipine": "Amlodipine",
    "metformin": "Metformin",
    "atorvastatin": "Atorvastatin",
    "insulin": "Insulin",
    "warfarin": "Warfarin",
}

def _normalize_medicine(name: str) -> str:
    """Bỏ phần tiếng Việt trong ngoặc, map về tên chuẩn ML."""
    cleaned = re.sub(r'\s*\([^)]*\)', '', name).strip()
    return _MEDICINE_CANONICAL.get(cleaned.lower(), cleaned)


@app.get("/api/patient/{user_id}/ml-features")
def get_patient_ml_features(user_id: int, db: Session = Depends(get_db)):
    """Tính 9 features cho ML adherence prediction từ dữ liệu thực."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()

    # 1. Age — tính từ birth_date, clamp 18–100
    age = 55  # default
    if user.birth_date:
        try:
            dob = date.fromisoformat(user.birth_date)
            age = max(18, min(100, (today - dob).days // 365))
        except ValueError:
            pass

    # 2. Gender
    gender = user.gender if user.gender in ("male", "female", "other") else "other"

    # 3. Prescriptions
    prescriptions = db.query(PrescriptionDB).filter(PrescriptionDB.user_id == user_id).all()
    medication_count = max(1, len(prescriptions))

    # Đơn thuốc chính: ưu tiên đang active (end_date >= today), rồi mới nhất
    active_rx = [
        p for p in prescriptions
        if not p.end_date or p.end_date >= today.isoformat()
    ]
    main_rx = active_rx[0] if active_rx else (prescriptions[-1] if prescriptions else None)

    medication_name = _normalize_medicine(main_rx.medicine) if main_rx else "Unknown"

    # 4. Daily dose count — số schedule của đơn chính
    daily_dose_count = 1
    if main_rx:
        count = db.query(ScheduleDB).filter(ScheduleDB.prescription_id == main_rx.id).count()
        daily_dose_count = max(1, count)

    # 5. Missed doses last 30 days
    cutoff_30d = datetime.utcnow() - timedelta(days=30)
    missed_30d = db.query(MedicationLogDB).filter(
        MedicationLogDB.user_id == user_id,
        MedicationLogDB.status == "missed",
        MedicationLogDB.timestamp >= cutoff_30d
    ).count()

    # 6. Caregiver support
    caregiver_support = user.caretaker_id is not None

    # 7. Previous adherence rate — toàn bộ lịch sử logs
    all_logs = db.query(MedicationLogDB).filter(MedicationLogDB.user_id == user_id).all()
    if all_logs:
        taken_count = sum(1 for log in all_logs if log.status == "taken")
        previous_adherence_rate = round(taken_count / len(all_logs), 4)
    else:
        previous_adherence_rate = 0.85

    # 8. Treatment duration — kể từ đơn thuốc sớm nhất
    treatment_duration_days = 180
    start_dates = [p.start_date for p in prescriptions if p.start_date]
    if start_dates:
        try:
            earliest = date.fromisoformat(min(start_dates))
            treatment_duration_days = max(1, min(3650, (today - earliest).days))
        except ValueError:
            pass

    return {
        "patient_id": str(user_id),
        "age": age,
        "gender": gender,
        "medication_name": medication_name,
        "medication_count": medication_count,
        "daily_dose_count": daily_dose_count,
        "missed_doses_last_30d": missed_30d,
        "caregiver_support": caregiver_support,
        "previous_adherence_rate": previous_adherence_rate,
        "treatment_duration_days": treatment_duration_days,
    }


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"message": "Smart Medicine Backend is running"}