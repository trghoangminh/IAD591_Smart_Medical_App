from __future__ import annotations

import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path

from smart_medical_ai.config import settings
from smart_medical_ai.models.chat import LogRow, PrescriptionRow, UserRow


class BackendDatabaseRepository:
    """Read-only access tới smart_medicine.db của backend service."""

    def __init__(self, database_path: Path | None = None) -> None:
        self._path = database_path or settings.backend_database_path

    def _connect(self) -> sqlite3.Connection:
        """Mở kết nối read-only tới backend DB."""
        if not self._path.exists():
            raise FileNotFoundError(
                f"Backend database not found at {self._path}. "
                "Hãy chạy back-end trước hoặc set SMART_MEDICAL_AI_BACKEND_DATABASE_PATH."
            )
        conn = sqlite3.connect(f"file:{self._path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def fetch_user(self, user_id: int) -> UserRow | None:
        """Lấy thông tin user theo id."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, name, role, phone, email, caretaker_id, birth_date, gender "
                "FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        if row is None:
            return None
        return UserRow(**dict(row))

    def fetch_caretaker(self, caretaker_id: int) -> UserRow | None:
        """Lấy thông tin bác sĩ / người chăm sóc."""
        return self.fetch_user(caretaker_id)

    def fetch_active_prescriptions(
        self,
        user_id: int,
        today: date,
        limit: int | None = None,
    ) -> list[PrescriptionRow]:
        """Lấy đơn thuốc đang active (end_date >= today hoặc NULL)."""
        limit = limit or settings.chat_prescription_limit
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, user_id, medicine, dosage, start_date, end_date
                FROM prescriptions
                WHERE user_id = ?
                  AND (end_date IS NULL OR end_date >= ?)
                ORDER BY start_date DESC
                LIMIT ?
                """,
                (user_id, today.isoformat(), limit),
            ).fetchall()
            prescriptions = [PrescriptionRow(**dict(r)) for r in rows]

            # Lấy schedule times cho từng đơn
            for pres in prescriptions:
                sched_rows = conn.execute(
                    "SELECT time FROM schedules WHERE prescription_id = ? ORDER BY time",
                    (pres.id,),
                ).fetchall()
                pres.times = [r["time"] for r in sched_rows]

        return prescriptions

    def fetch_recent_logs(self, user_id: int, days: int | None = None) -> list[LogRow]:
        """Lấy log uống thuốc trong N ngày gần nhất."""
        days = days or settings.chat_history_days
        since = datetime.utcnow() - timedelta(days=days)
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT medicine, status, scheduled_time, timestamp
                FROM medication_logs
                WHERE user_id = ? AND timestamp >= ?
                ORDER BY timestamp DESC
                """,
                (user_id, since.isoformat()),
            ).fetchall()
        return [LogRow(**dict(r)) for r in rows]
