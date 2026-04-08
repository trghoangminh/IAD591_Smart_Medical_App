from __future__ import annotations

from smart_medical_ai.ml.train import train_model
from smart_medical_ai.models.adherence import AdherencePredictionRequest
from smart_medical_ai.services.predictor import PredictorService


def test_predictor_scores_high_risk_higher_than_low_risk(tmp_path):
    model_path = tmp_path / "model.pkl"
    train_model(model_path=model_path)
    service = PredictorService(model_path=model_path)

    high_risk = service.predict(
        AdherencePredictionRequest(
            patient_id="patient-high",
            age=70,
            gender="female",
            medication_name="Prednisone",
            medication_count=4,
            daily_dose_count=4,
            refill_gap_days=9,
            missed_doses_last_30d=9,
            side_effect_severity=7,
            cost_burden_score=7,
            reminder_enabled=False,
            caregiver_support=False,
            previous_adherence_rate=0.58,
            treatment_duration_days=320,
            condition_complexity_score=7,
        )
    )
    low_risk = service.predict(
        AdherencePredictionRequest(
            patient_id="patient-low",
            age=48,
            gender="male",
            medication_name="Amlodipine",
            medication_count=1,
            daily_dose_count=1,
            refill_gap_days=0,
            missed_doses_last_30d=0,
            side_effect_severity=1,
            cost_burden_score=1,
            reminder_enabled=True,
            caregiver_support=True,
            previous_adherence_rate=0.97,
            treatment_duration_days=120,
            condition_complexity_score=2,
        )
    )

    assert high_risk.risk_score > low_risk.risk_score
    assert high_risk.predicted_label in {"medium", "high"}
    assert low_risk.predicted_label == "low"
    assert high_risk.top_factors
    assert high_risk.recommendations
