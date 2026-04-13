from datetime import datetime
from typing import Generator, List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

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

    prescriptions = relationship("PrescriptionDB", back_populates="user")
    logs = relationship("MedicationLogDB", back_populates="user")
    notifications = relationship("NotificationDB", back_populates="user")


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

class LoginRequest(BaseModel):
    username: str = Field(..., description="Phone number or Email", example="0987654321")
    password: str = Field(..., example="123456")

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
        caretaker_id=user.caretaker_id
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
            "caretaker_id": user.caretaker_id
        },
    }

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
def check_missed_schedules(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    current_time_str = now.strftime("%H:%M") # Giả sử time lưu dưới dạng HH:MM
    
    # Tìm các schedule pending
    schedules = (
        db.query(ScheduleDB, PrescriptionDB)
        .join(PrescriptionDB, ScheduleDB.prescription_id == PrescriptionDB.id)
        .filter(ScheduleDB.status == "pending")
        .all()
    )

    missed_count = 0
    # Logic đơn giản: Nếu thời gian hiện hành lớn hơn scheduled time + 30 phút -> missed
    # Trong thực tế cần parse cẩn thận nếu nối qua ngày, ở đây làm basic string compare hoặc tính toán phút
    
    for schedule, prescription in schedules:
        try:
            scheduled_datetime = datetime.strptime(schedule.time, "%H:%M")
            now_datetime = datetime.strptime(current_time_str, "%H:%M")
            
            # Tính số phút chênh lệch. Note: nếu qua ngày thì delta sẽ âm, để an toàn ta bỏ qua hoặc xử lý riêng, 
            # Giả định xử lý trong cùng 1 ngày
            diff_minutes = (now_datetime - scheduled_datetime).total_seconds() / 60
            
            if diff_minutes > 30: # Nếu trễ trên 30 phút
                schedule.status = "missed"
                missed_count += 1
                
                # Ghi Log
                log = MedicationLogDB(
                    user_id=prescription.user_id,
                    schedule_id=schedule.id,
                    medicine=prescription.medicine,
                    scheduled_time=schedule.time,
                    status="missed",
                    timestamp=now,
                )
                db.add(log)
                
                # Lấy thông tin user bệnh nhân
                patient = db.query(UserDB).filter(UserDB.id == prescription.user_id).first()
                if patient:
                    # Tạo notification cho bệnh nhân
                    notif_patient = NotificationDB(
                        user_id=patient.id,
                        message=f"Bạn đã quên uống {prescription.medicine} theo lịch lúc {schedule.time}."
                    )
                    db.add(notif_patient)
                    
                    # Nếu có người giám sát (Bác sĩ/Người nhà), tạo thông báo đẩy cho họ
                    if patient.caretaker_id:
                        notif_caretaker = NotificationDB(
                            user_id=patient.caretaker_id,
                            message=f"Bệnh nhân {patient.name} đã quên xác nhận uống {prescription.medicine} vào lúc {schedule.time}."
                        )
                        db.add(notif_caretaker)

        except Exception as e:
            pass # Lỗi parse time

    db.commit()
    return {"message": "Checked missed schedules", "missed_updated": missed_count}


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

    adherence_rate = (taken_count / total_schedules * 100) if total_schedules > 0 else 0

    return {
        "user_id": user_id,
        "total_schedules": total_schedules,
        "taken": taken_count,
        "missed": missed_count,
        "adherence_rate": round(adherence_rate, 2),
    }


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"message": "Smart Medicine Backend is running"}