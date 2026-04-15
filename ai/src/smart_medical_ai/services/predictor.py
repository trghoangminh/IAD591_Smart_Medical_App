from __future__ import annotations

from pathlib import Path

import joblib

from smart_medical_ai.config import settings
from smart_medical_ai.ml.features import prepare_feature_frame
from smart_medical_ai.ml.train import train_model
from smart_medical_ai.models.adherence import (
    AdherencePredictionRequest,
    PredictionResponse,
    RiskFactor,
)


class PredictorService:
    def __init__(self, model_path: Path | None = None) -> None:
        self.model_path = model_path or settings.model_path
        self._artifact: dict | None = None

    def ensure_ready(self) -> None:
        self._load_artifact()

    def _load_artifact(self) -> dict:
        if self._artifact is not None:
            return self._artifact

        if not self.model_path.exists():
            self._artifact = train_model(model_path=self.model_path)
            return self._artifact

        self._artifact = joblib.load(self.model_path)
        return self._artifact

    def predict(self, payload: AdherencePredictionRequest) -> PredictionResponse:
        artifact = self._load_artifact()
        pipeline = artifact["pipeline"]
        feature_frame = prepare_feature_frame(payload.model_dump())

        probability_non_adherent = float(pipeline.predict_proba(feature_frame)[0][1])
        risk_score = round(probability_non_adherent * 100.0, 1)
        predicted_label = self._resolve_label(probability_non_adherent)
        top_factors = self._build_top_factors(payload, artifact.get("feature_importances", {}))
        recommendations = self._build_recommendations(payload, predicted_label, top_factors)

        return PredictionResponse(
            patient_id=payload.patient_id,
            medication_name=payload.medication_name,
            risk_score=risk_score,
            probability_non_adherent=round(probability_non_adherent, 4),
            predicted_label=predicted_label,
            top_factors=top_factors,
            recommendations=recommendations,
            model_version=artifact.get("model_version", "bootstrap-model"),
        )

    @staticmethod
    def _resolve_label(probability_non_adherent: float) -> str:
        if probability_non_adherent >= 0.7:
            return "high"
        if probability_non_adherent >= 0.4:
            return "medium"
        return "low"

    @staticmethod
    def _importance_weight(feature_importances: dict[str, float], feature_name: str) -> float:
        return sum(value for name, value in feature_importances.items() if feature_name in name)

    def _build_top_factors(
        self,
        payload: AdherencePredictionRequest,
        feature_importances: dict[str, float],
    ) -> list[RiskFactor]:
        candidate_factors = []
        values = payload.model_dump()

        def add_factor(feature: str, severity: str, detail: str) -> None:
            candidate_factors.append(
                {
                    "feature": feature,
                    "weight": self._importance_weight(feature_importances, feature),
                    "factor": feature.replace("_", " ").capitalize(),
                    "severity": severity,
                    "detail": detail,
                }
            )

        if values["missed_doses_last_30d"] >= 6:
            add_factor("missed_doses_last_30d", "high", "So lieu bo lo trong 30 ngay qua dang o muc cao.")
        if values["previous_adherence_rate"] < 0.75:
            add_factor("previous_adherence_rate", "high", "Ti le tuan thu lich su thap, de tai dien hanh vi quen thuoc.")
        if values["daily_dose_count"] >= 4:
            add_factor("daily_dose_count", "medium", "Phac do nhieu lan trong ngay lam giam kha nang tuan thu.")
        if not values["caregiver_support"]:
            add_factor("caregiver_support", "medium", "Khong co nguoi ho tro nhac khi lich dung thuoc phuc tap.")

        if not candidate_factors:
            add_factor("previous_adherence_rate", "protective", "Ti le tuan thu lich su tot va on dinh.")

        ordered = sorted(
            candidate_factors,
            key=lambda item: (
                {"high": 3, "medium": 2, "protective": 1}[item["severity"]],
                item["weight"],
            ),
            reverse=True,
        )
        return [RiskFactor(**{k: v for k, v in factor.items() if k in {"factor", "severity", "detail"}}) for factor in ordered[:3]]

    @staticmethod
    def _build_recommendations(
        payload: AdherencePredictionRequest,
        predicted_label: str,
        top_factors: list[RiskFactor],
    ) -> list[str]:
        recommendations: list[str] = []
        risk_factor_names = {factor.factor.lower() for factor in top_factors}

        if "missed doses last 30d" in risk_factor_names or payload.missed_doses_last_30d >= 6:
            recommendations.append("Tang can suat follow-up 48-72 gio va tao nhac lan hai cho cac lieu hay bi quen.")
        if predicted_label == "high":
            recommendations.append("Xep benh nhan vao nhom can can thiệp som va theo doi sat trong 2 tuan toi.")

        if not recommendations:
            recommendations.append("Duy tri phac do hien tai va tiep tuc theo doi trend tuan de phat hien som bien dong.")

        return recommendations[:3]


predictor_service = PredictorService()
