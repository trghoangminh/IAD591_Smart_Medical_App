from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Period = Literal["week", "month"]
RiskLabel = Literal["low", "medium", "high"]
TrendDirection = Literal["improving", "stable", "declining"]
RiskSeverity = Literal["high", "medium", "protective"]


class AdherencePredictionRequest(BaseModel):
    patient_id: str = Field(default="demo-patient", min_length=1)
    age: int = Field(default=55, ge=18, le=100)
    gender: Literal["male", "female", "other"] = "other"
    medication_name: str = Field(default="Metformin", min_length=2)
    medication_count: int = Field(default=2, ge=1, le=12)
    daily_dose_count: int = Field(default=2, ge=1, le=12)
    refill_gap_days: int = Field(default=0, ge=0, le=90)
    missed_doses_last_30d: int = Field(default=1, ge=0, le=120)
    side_effect_severity: int = Field(default=2, ge=0, le=10)
    cost_burden_score: int = Field(default=2, ge=0, le=10)
    reminder_enabled: bool = True
    caregiver_support: bool = False
    previous_adherence_rate: float = Field(default=0.92, ge=0.0, le=1.0)
    treatment_duration_days: int = Field(default=180, ge=1, le=3650)
    condition_complexity_score: int = Field(default=3, ge=0, le=10)


class RiskFactor(BaseModel):
    factor: str
    severity: RiskSeverity
    detail: str


class PredictionResponse(BaseModel):
    patient_id: str
    medication_name: str
    risk_score: float = Field(ge=0.0, le=100.0)
    probability_non_adherent: float = Field(ge=0.0, le=1.0)
    predicted_label: RiskLabel
    top_factors: list[RiskFactor]
    recommendations: list[str]
    model_version: str


class OverviewResponse(BaseModel):
    patient_id: str
    period: Period
    total_doses: int
    taken_doses: int
    missed_doses: int
    delayed_doses: int
    adherence_rate: float = Field(ge=0.0, le=100.0)
    average_delay_minutes: float = Field(ge=0.0)
    current_risk_score: float = Field(ge=0.0, le=100.0)
    trend_direction: TrendDirection


class ChartPoint(BaseModel):
    label: str
    adherence_rate: float = Field(ge=0.0, le=100.0)
    taken_doses: int
    missed_doses: int


class MedicationMissPattern(BaseModel):
    medication_name: str
    missed_doses: int
    adherence_rate: float = Field(ge=0.0, le=100.0)


class ChartsResponse(BaseModel):
    patient_id: str
    period: Period
    series: list[ChartPoint]
    top_missed_medications: list[MedicationMissPattern]
