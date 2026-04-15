from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


FEATURE_COLUMNS = [
    "age",
    "gender",
    "medication_name",
    "medication_count",
    "daily_dose_count",
    "missed_doses_last_30d",
    "caregiver_support",
    "previous_adherence_rate",
    "treatment_duration_days",
]

NUMERIC_FEATURES = [
    "age",
    "medication_count",
    "daily_dose_count",
    "missed_doses_last_30d",
    "caregiver_support",
    "previous_adherence_rate",
    "treatment_duration_days",
]

CATEGORICAL_FEATURES = ["gender", "medication_name"]

DEFAULT_FEATURE_VALUES: dict[str, Any] = {
    "age": 55,
    "gender": "other",
    "medication_name": "Unknown",
    "medication_count": 2,
    "daily_dose_count": 2,
    "missed_doses_last_30d": 2,
    "caregiver_support": 0,
    "previous_adherence_rate": 0.85,
    "treatment_duration_days": 180,
}

TARGET_COLUMN = "non_adherent"

COLUMN_ALIASES: dict[str, list[str]] = {
    "age": ["patient_age"],
    "gender": ["sex"],
    "medication_name": [
        "medication",
        "drug",
        "drug_name",
        "medicine_name",
        "medication_type",
        "medicine",
    ],
    "medication_count": [
        "number_of_medications",
        "num_medications",
        "med_count",
        "medication_number",
    ],
    "daily_dose_count": [
        "doses_per_day",
        "frequency_per_day",
        "dose_frequency",
        "frequency",
    ],
    "missed_doses_last_30d": [
        "missed_doses",
        "missed_doses_last_month",
        "missed_doses_last_30_days",
    ],
    "caregiver_support": ["family_support", "support_system", "care_support"],
    "previous_adherence_rate": [
        "adherence_rate",
        "adherence_to_treatment",
        "adherence_percentage",
        "previous_adherence",
        "treatment_adherence",
    ],
    "treatment_duration_days": [
        "treatment_duration",
        "therapy_duration_days",
        "days_on_therapy",
    ],
    TARGET_COLUMN: [
        "adherence_status",
        "adherence",
        "medication_adherence",
        "compliance_status",
        "outcome",
        "label",
        "target",
    ],
}


def normalize_column_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")


def _rename_alias_columns(dataframe: pd.DataFrame) -> pd.DataFrame:
    renamed = dataframe.rename(columns={column: normalize_column_name(column) for column in dataframe.columns})
    applied: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in [canonical, *aliases]:
            normalized_alias = normalize_column_name(alias)
            if normalized_alias in renamed.columns:
                applied[normalized_alias] = canonical
                break
    return renamed.rename(columns=applied)


def _coerce_numeric(series: pd.Series | None, default: float) -> pd.Series:
    if series is None:
        return pd.Series(dtype=float)
    return pd.to_numeric(series, errors="coerce").fillna(default)


def _coerce_bool(series: pd.Series | None, default: int) -> pd.Series:
    if series is None:
        return pd.Series(dtype=int)

    def convert(value: Any) -> int:
        if pd.isna(value):
            return default
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return int(float(value) > 0)
        normalized = normalize_column_name(str(value))
        if normalized in {"yes", "true", "enabled", "on", "y"}:
            return 1
        if normalized in {"no", "false", "disabled", "off", "n"}:
            return 0
        return default

    return series.map(convert)


def _coerce_text(series: pd.Series | None, default: str) -> pd.Series:
    if series is None:
        return pd.Series(dtype=str)
    return series.fillna(default).astype(str).str.strip().replace("", default)


def frequency_to_daily_dose(value: Any) -> int:
    if pd.isna(value):
        return int(DEFAULT_FEATURE_VALUES["daily_dose_count"])
    if isinstance(value, (int, float)):
        return max(1, int(round(float(value))))

    normalized = normalize_column_name(str(value))
    match = re.search(r"(\d+)", normalized)
    if match:
        return max(1, int(match.group(1)))

    mapping = {
        "daily": 1,
        "once": 1,
        "once_daily": 1,
        "bid": 2,
        "twice": 2,
        "twice_daily": 2,
        "tid": 3,
        "three": 3,
        "three_times": 3,
        "qid": 4,
        "four": 4,
    }
    for token, number in mapping.items():
        if token in normalized:
            return number
    return int(DEFAULT_FEATURE_VALUES["daily_dose_count"])


def _coerce_daily_doses(series: pd.Series | None) -> pd.Series:
    if series is None:
        return pd.Series(dtype=int)
    return series.map(frequency_to_daily_dose)


def _coerce_rate(series: pd.Series | None, default: float) -> pd.Series:
    if series is None:
        return pd.Series(dtype=float)

    numeric = pd.to_numeric(series, errors="coerce")
    numeric = numeric.fillna(default)
    numeric = numeric.where(numeric <= 1.0, numeric / 100.0)
    return numeric.clip(0.0, 1.0)


def _coerce_target(series: pd.Series) -> pd.Series:
    def convert(value: Any) -> int:
        if pd.isna(value):
            return 0
        if isinstance(value, (int, float)):
            numeric = float(value)
            if 0.0 <= numeric <= 1.0:
                return int(numeric >= 0.5)
            if 1.0 < numeric <= 100.0:
                return int(numeric < 80.0)
            return int(numeric > 0)

        normalized = normalize_column_name(str(value))
        if normalized in {"adherent", "compliant", "good", "yes", "true"}:
            return 0
        if normalized in {
            "non_adherent",
            "nonadherent",
            "not_adherent",
            "poor",
            "missed",
            "non_compliant",
            "no",
            "false",
        }:
            return 1
        return 0

    return series.map(convert).astype(int)


def prepare_feature_frame(payload: dict[str, Any] | pd.DataFrame) -> pd.DataFrame:
    raw_frame = pd.DataFrame([payload]) if isinstance(payload, dict) else payload.copy()
    renamed = _rename_alias_columns(raw_frame)
    features = pd.DataFrame(index=renamed.index)

    features["age"] = _coerce_numeric(renamed.get("age"), DEFAULT_FEATURE_VALUES["age"])
    features["gender"] = _coerce_text(renamed.get("gender"), DEFAULT_FEATURE_VALUES["gender"]).str.lower()
    features["medication_name"] = _coerce_text(
        renamed.get("medication_name"),
        DEFAULT_FEATURE_VALUES["medication_name"],
    )
    features["medication_count"] = _coerce_numeric(
        renamed.get("medication_count"),
        DEFAULT_FEATURE_VALUES["medication_count"],
    )
    features["daily_dose_count"] = _coerce_daily_doses(renamed.get("daily_dose_count"))
    features["missed_doses_last_30d"] = _coerce_numeric(
        renamed.get("missed_doses_last_30d"),
        DEFAULT_FEATURE_VALUES["missed_doses_last_30d"],
    )
    features["caregiver_support"] = _coerce_bool(
        renamed.get("caregiver_support"),
        int(DEFAULT_FEATURE_VALUES["caregiver_support"]),
    )
    features["previous_adherence_rate"] = _coerce_rate(
        renamed.get("previous_adherence_rate"),
        float(DEFAULT_FEATURE_VALUES["previous_adherence_rate"]),
    )
    features["treatment_duration_days"] = _coerce_numeric(
        renamed.get("treatment_duration_days"),
        DEFAULT_FEATURE_VALUES["treatment_duration_days"],
    )

    for column in NUMERIC_FEATURES:
        features[column] = pd.to_numeric(features[column], errors="coerce")

    return features[FEATURE_COLUMNS]


def split_training_frame(dataframe: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    renamed = _rename_alias_columns(dataframe)
    if TARGET_COLUMN not in renamed.columns:
        raise ValueError(
            "Dataset is missing an adherence target column. "
            "Expected one of: adherence_status, adherence, compliance_status, label, target."
        )

    features = prepare_feature_frame(renamed)
    target = _coerce_target(renamed[TARGET_COLUMN])
    if target.nunique() < 2:
        raise ValueError("Training dataset must contain at least two target classes.")
    return features, target


def read_dataset(dataset_path: Path) -> pd.DataFrame:
    suffix = dataset_path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(dataset_path)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(dataset_path)
    raise ValueError(f"Unsupported dataset format: {dataset_path.suffix}")


def generate_bootstrap_dataset(sample_count: int = 640, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    medication_names = ["Metformin", "Atorvastatin", "Amlodipine", "Insulin", "Warfarin"]

    frame = pd.DataFrame(
        {
            "age": rng.integers(22, 85, size=sample_count),
            "gender": rng.choice(["male", "female", "other"], size=sample_count, p=[0.45, 0.5, 0.05]),
            "medication_name": rng.choice(medication_names, size=sample_count),
            "medication_count": rng.integers(1, 6, size=sample_count),
            "daily_dose_count": rng.integers(1, 5, size=sample_count),
            "missed_doses_last_30d": rng.integers(0, 12, size=sample_count),
            "caregiver_support": rng.choice([0, 1], size=sample_count, p=[0.7, 0.3]),
            "previous_adherence_rate": rng.uniform(0.45, 0.99, size=sample_count),
            "treatment_duration_days": rng.integers(14, 900, size=sample_count),
        }
    )

    risk_signal = (
        0.11 * frame["missed_doses_last_30d"]
        + 0.12 * frame["daily_dose_count"]
        + 0.03 * frame["medication_count"]
        - 1.40 * frame["previous_adherence_rate"]
        - 0.30 * frame["caregiver_support"]
    )
    probabilities = 1.0 / (1.0 + np.exp(-(risk_signal - 1.5)))
    random_noise = rng.random(sample_count)
    frame[TARGET_COLUMN] = (random_noise < probabilities).astype(int)
    return frame


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )
