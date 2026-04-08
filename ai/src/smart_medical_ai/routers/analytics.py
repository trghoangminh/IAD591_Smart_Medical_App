from __future__ import annotations

from fastapi import APIRouter, Query

from smart_medical_ai.models.adherence import (
    AdherencePredictionRequest,
    ChartsResponse,
    OverviewResponse,
    Period,
    PredictionResponse,
)
from smart_medical_ai.services.analytics import analytics_service
from smart_medical_ai.services.predictor import predictor_service


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    patient_id: str = Query(default="demo-patient"),
    period: Period = Query(default="week"),
) -> OverviewResponse:
    return analytics_service.get_overview(patient_id=patient_id, period=period)


@router.get("/charts", response_model=ChartsResponse)
def get_charts(
    patient_id: str = Query(default="demo-patient"),
    period: Period = Query(default="week"),
) -> ChartsResponse:
    return analytics_service.get_charts(patient_id=patient_id, period=period)


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: AdherencePredictionRequest) -> PredictionResponse:
    return predictor_service.predict(payload)
