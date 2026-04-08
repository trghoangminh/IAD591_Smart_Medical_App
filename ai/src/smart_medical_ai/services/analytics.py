from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd

from smart_medical_ai.models.adherence import (
    ChartPoint,
    ChartsResponse,
    MedicationMissPattern,
    OverviewResponse,
    Period,
)
from smart_medical_ai.repos.database import DatabaseRepository


VIETNAMESE_WEEKDAYS = {
    0: "T2",
    1: "T3",
    2: "T4",
    3: "T5",
    4: "T6",
    5: "T7",
    6: "CN",
}


class AnalyticsService:
    def __init__(self, repository: DatabaseRepository | None = None) -> None:
        self.repository = repository or DatabaseRepository()
        self.repository.initialize()

    def get_overview(self, patient_id: str = "demo-patient", period: Period = "week") -> OverviewResponse:
        frame = self._load_frame(patient_id, period)
        if frame.empty:
            return OverviewResponse(
                patient_id=patient_id,
                period=period,
                total_doses=0,
                taken_doses=0,
                missed_doses=0,
                delayed_doses=0,
                adherence_rate=0.0,
                average_delay_minutes=0.0,
                current_risk_score=0.0,
                trend_direction="stable",
            )

        total_doses = int(len(frame))
        taken_doses = int(frame["taken"].sum())
        missed_doses = int(total_doses - taken_doses)
        delayed_doses = int(((frame["taken"] == 1) & (frame["delay_minutes"] > 30)).sum())
        adherence_rate = round((taken_doses / total_doses) * 100.0, 1)
        average_delay_minutes = round(
            float(frame.loc[frame["taken"] == 1, "delay_minutes"].mean() or 0.0),
            1,
        )
        current_risk_score = self._estimate_risk_score(frame)
        trend_direction = self._derive_trend_direction(frame)

        return OverviewResponse(
            patient_id=patient_id,
            period=period,
            total_doses=total_doses,
            taken_doses=taken_doses,
            missed_doses=missed_doses,
            delayed_doses=delayed_doses,
            adherence_rate=adherence_rate,
            average_delay_minutes=average_delay_minutes,
            current_risk_score=current_risk_score,
            trend_direction=trend_direction,
        )

    def get_charts(self, patient_id: str = "demo-patient", period: Period = "week") -> ChartsResponse:
        frame = self._load_frame(patient_id, period)
        if period == "week":
            series = self._build_daily_series(frame)
        else:
            series = self._build_weekly_series(frame)

        top_missed_medications = self._build_top_missed_medications(frame)
        return ChartsResponse(
            patient_id=patient_id,
            period=period,
            series=series,
            top_missed_medications=top_missed_medications,
        )

    def _load_frame(self, patient_id: str, period: Period) -> pd.DataFrame:
        days = 7 if period == "week" else 30
        start_at = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
        return self.repository.fetch_adherence_frame(patient_id=patient_id, start_at=start_at)

    @staticmethod
    def _estimate_risk_score(frame: pd.DataFrame) -> float:
        adherence_rate = frame["taken"].mean() * 100.0
        missed_recent = int((frame.tail(min(len(frame), 12))["taken"] == 0).sum())
        average_delay = float(frame.loc[frame["taken"] == 1, "delay_minutes"].mean() or 0.0)
        score = (100.0 - adherence_rate) * 0.72 + min(missed_recent * 4.5, 25.0) + min(average_delay / 8.0, 10.0)
        return round(max(0.0, min(score, 100.0)), 1)

    @staticmethod
    def _derive_trend_direction(frame: pd.DataFrame) -> str:
        daily_adherence = frame.assign(day=frame["scheduled_at"].dt.date).groupby("day")["taken"].mean()
        if len(daily_adherence) < 4:
            return "stable"

        midpoint = len(daily_adherence) // 2
        previous_mean = float(daily_adherence.iloc[:midpoint].mean() * 100.0)
        recent_mean = float(daily_adherence.iloc[midpoint:].mean() * 100.0)
        delta = recent_mean - previous_mean
        if delta >= 5.0:
            return "improving"
        if delta <= -5.0:
            return "declining"
        return "stable"

    def _build_daily_series(self, frame: pd.DataFrame) -> list[ChartPoint]:
        end_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_day = end_day - timedelta(days=6)
        all_days = pd.date_range(start=start_day, end=end_day, freq="D")

        if frame.empty:
            grouped = pd.DataFrame(index=all_days, columns=["taken_doses", "total_doses"]).fillna(0)
        else:
            grouped = (
                frame.assign(day=frame["scheduled_at"].dt.floor("D"))
                .groupby("day")["taken"]
                .agg(taken_doses="sum", total_doses="count")
                .reindex(all_days, fill_value=0)
            )

        points = []
        for day, row in grouped.iterrows():
            total_doses = int(row["total_doses"])
            taken_doses = int(row["taken_doses"])
            missed_doses = total_doses - taken_doses
            adherence_rate = round((taken_doses / total_doses) * 100.0, 1) if total_doses else 0.0
            points.append(
                ChartPoint(
                    label=VIETNAMESE_WEEKDAYS[day.weekday()],
                    adherence_rate=adherence_rate,
                    taken_doses=taken_doses,
                    missed_doses=missed_doses,
                )
            )
        return points

    def _build_weekly_series(self, frame: pd.DataFrame) -> list[ChartPoint]:
        end_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        start_day = end_day - timedelta(days=29)
        start_monday = start_day - timedelta(days=start_day.weekday())
        week_index = pd.date_range(start=start_monday, end=end_day, freq="W-MON")

        if frame.empty:
            grouped = pd.DataFrame(index=week_index, columns=["taken_doses", "total_doses"]).fillna(0)
        else:
            grouped = (
                frame.assign(week=frame["scheduled_at"].dt.to_period("W-MON").dt.start_time)
                .groupby("week")["taken"]
                .agg(taken_doses="sum", total_doses="count")
                .reindex(week_index, fill_value=0)
            )

        points = []
        for index, (_, row) in enumerate(grouped.iterrows(), start=1):
            total_doses = int(row["total_doses"])
            taken_doses = int(row["taken_doses"])
            missed_doses = total_doses - taken_doses
            adherence_rate = round((taken_doses / total_doses) * 100.0, 1) if total_doses else 0.0
            points.append(
                ChartPoint(
                    label=f"Tuần {index}",
                    adherence_rate=adherence_rate,
                    taken_doses=taken_doses,
                    missed_doses=missed_doses,
                )
            )
        return points

    @staticmethod
    def _build_top_missed_medications(frame: pd.DataFrame) -> list[MedicationMissPattern]:
        if frame.empty:
            return []

        grouped = (
            frame.groupby("medication_name")["taken"]
            .agg(taken_doses="sum", total_doses="count")
            .assign(missed_doses=lambda df: df["total_doses"] - df["taken_doses"])
            .sort_values(by=["missed_doses", "total_doses"], ascending=[False, False])
        )

        patterns = []
        for medication_name, row in grouped.head(3).iterrows():
            total_doses = int(row["total_doses"])
            taken_doses = int(row["taken_doses"])
            adherence_rate = round((taken_doses / total_doses) * 100.0, 1) if total_doses else 0.0
            patterns.append(
                MedicationMissPattern(
                    medication_name=str(medication_name),
                    missed_doses=int(row["missed_doses"]),
                    adherence_rate=adherence_rate,
                )
            )
        return patterns


analytics_service = AnalyticsService()
