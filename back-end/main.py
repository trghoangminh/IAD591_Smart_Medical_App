from datetime import datetime
from typing import Generator, List, Literal

from fastapi import Depends, FastAPI, HTTPException
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

    prescriptions = relationship("PrescriptionDB", back_populates="user")
    logs = relationship("MedicationLogDB", back_populates="user")


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
    status = Column(String, default="pending", nullable=False)  # pending / taken

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


# Tạo database + bảng
Base.metadata.create_all(bind=engine)


# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Smart Medicine Backend")


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
class LoginRequest(BaseModel):
    id: int = Field(..., example=1)
    name: str = Field(..., example="Nguyen Van A")
    role: Literal["patient", "doctor", "family"] = "patient"


class PrescriptionCreate(BaseModel):
    user_id: int = Field(..., example=1)
    medicine: str = Field(..., example="Paracetamol")
    dosage: int = Field(..., example=2)
    times: List[str] = Field(..., example=["08:00", "20:00"])
    start_date: str | None = Field(default=None, example="2026-04-12")
    end_date: str | None = Field(default=None, example="2026-04-20")


class ConfirmRequest(BaseModel):
    user_id: int = Field(..., example=1)
    medicine: str = Field(..., example="Paracetamol")
    time: str = Field(..., example="08:00")


# =========================
# API 1: LOGIN
# =========================
@app.post("/api/auth/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(UserDB).filter(UserDB.id == user.id).first()

    if existing_user:
        existing_user.name = user.name
        existing_user.role = user.role
        db.commit()
        db.refresh(existing_user)
        return {
            "message": "Login success (updated existing user)",
            "user": {
                "id": existing_user.id,
                "name": existing_user.name,
                "role": existing_user.role,
            },
        }

    new_user = UserDB(id=user.id, name=user.name, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Login success",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "role": new_user.role,
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
# API 5: HISTORY
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
# API 6: ANALYTICS
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