from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from smart_medical_ai.config import settings


class DatabaseRepository:
    def __init__(self, database_path: Path | None = None) -> None:
        self.database_path = database_path or settings.database_path

    def connect(self) -> sqlite3.Connection:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS adherence_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id TEXT NOT NULL,
                    medication_name TEXT NOT NULL,
                    scheduled_at TEXT NOT NULL,
                    taken INTEGER NOT NULL,
                    delay_minutes INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            count = connection.execute("SELECT COUNT(*) FROM adherence_logs").fetchone()[0]
            if count == 0:
                self._seed_demo_data(connection)
            connection.commit()

    def _seed_demo_data(self, connection: sqlite3.Connection) -> None:
        rng = np.random.default_rng(7)
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        medication_plans = [
            ("Metformin", [8, 20], 0.84),
            ("Amlodipine", [7], 0.93),
            ("Prednisone", [13], 0.76),
        ]

        rows: list[tuple[str, str, str, int, int]] = []
        for day_offset in range(44, -1, -1):
            current_day = today - timedelta(days=day_offset)
            weekend_penalty = 0.08 if current_day.weekday() >= 5 else 0.0
            fatigue_penalty = 0.03 if day_offset < 10 else 0.0

            for medication_name, hours, base_probability in medication_plans:
                for hour in hours:
                    scheduled_at = current_day.replace(hour=hour)
                    took_dose = int(rng.random() < max(0.15, base_probability - weekend_penalty - fatigue_penalty))
                    delay_minutes = 0
                    if took_dose:
                        delay_minutes = int(max(0, rng.normal(18 + (1 - base_probability) * 35, 10)))
                    rows.append(
                        (
                            "demo-patient",
                            medication_name,
                            scheduled_at.isoformat(),
                            took_dose,
                            delay_minutes,
                        )
                    )

        connection.executemany(
            """
            INSERT INTO adherence_logs (patient_id, medication_name, scheduled_at, taken, delay_minutes)
            VALUES (?, ?, ?, ?, ?)
            """,
            rows,
        )

    def fetch_adherence_frame(self, patient_id: str, start_at: datetime) -> pd.DataFrame:
        self.initialize()
        with self.connect() as connection:
            frame = pd.read_sql_query(
                """
                SELECT patient_id, medication_name, scheduled_at, taken, delay_minutes
                FROM adherence_logs
                WHERE patient_id = ? AND scheduled_at >= ?
                ORDER BY scheduled_at
                """,
                connection,
                params=[patient_id, start_at.isoformat()],
                parse_dates=["scheduled_at"],
            )

        if frame.empty:
            return frame

        frame["taken"] = frame["taken"].astype(int)
        frame["delay_minutes"] = frame["delay_minutes"].astype(int)
        frame["scheduled_at"] = pd.to_datetime(frame["scheduled_at"])
        return frame
