from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from smart_medical_ai.config import settings
from smart_medical_ai.ml.features import (
    FEATURE_COLUMNS,
    build_preprocessor,
    generate_bootstrap_dataset,
    read_dataset,
    split_training_frame,
)

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover - optional dependency
    XGBClassifier = None


def build_estimator(model_type: str, random_state: int) -> Any:
    if model_type == "xgboost":
        if XGBClassifier is None:
            raise RuntimeError("xgboost is not installed. Install the [xgboost] extra to use this model type.")
        return XGBClassifier(
            n_estimators=220,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            eval_metric="logloss",
            random_state=random_state,
        )

    return RandomForestClassifier(
        n_estimators=280,
        max_depth=10,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=random_state,
    )


def build_training_pipeline(model_type: str = "random_forest") -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("model", build_estimator(model_type, settings.random_state)),
        ]
    )


def resolve_training_frame(dataset_path: Path | None = None) -> tuple[Any, str]:
    resolved_path = dataset_path or settings.detect_dataset_path()
    if resolved_path is not None:
        return read_dataset(resolved_path), str(resolved_path)
    return generate_bootstrap_dataset(settings.bootstrap_sample_count, settings.random_state), "synthetic-bootstrap"


def compute_metrics(pipeline: Pipeline, x_test: Any, y_test: Any) -> dict[str, float]:
    predictions = pipeline.predict(x_test)
    probabilities = pipeline.predict_proba(x_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
    }
    if len(set(y_test)) > 1:
        metrics["roc_auc"] = round(float(roc_auc_score(y_test, probabilities)), 4)
    return metrics


def extract_feature_importances(pipeline: Pipeline) -> dict[str, float]:
    model = pipeline.named_steps["model"]
    if not hasattr(model, "feature_importances_"):
        return {}

    preprocessor = pipeline.named_steps["preprocessor"]
    transformed_names = preprocessor.get_feature_names_out(FEATURE_COLUMNS)
    raw_importances = model.feature_importances_
    if len(transformed_names) != len(raw_importances):
        return {}
    return {
        name: round(float(value), 6)
        for name, value in sorted(
            zip(transformed_names, raw_importances, strict=False),
            key=lambda item: item[1],
            reverse=True,
        )
    }


def train_model(
    dataset_path: Path | None = None,
    model_path: Path | None = None,
    model_type: str = "random_forest",
) -> dict[str, Any]:
    settings.ensure_directories()
    raw_frame, training_source = resolve_training_frame(dataset_path)
    features, target = split_training_frame(raw_frame)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.2,
        random_state=settings.random_state,
        stratify=target,
    )

    pipeline = build_training_pipeline(model_type=model_type)
    pipeline.fit(x_train, y_train)

    metrics = compute_metrics(pipeline, x_test, y_test)
    feature_importances = extract_feature_importances(pipeline)
    artifact = {
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "feature_importances": feature_importances,
        "metrics": metrics,
        "model_type": model_type,
        "training_source": training_source,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_version": f"{model_type}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "target_label": "1 = non_adherent",
    }

    resolved_model_path = model_path or settings.model_path
    resolved_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, resolved_model_path)
    return artifact


def _main() -> None:
    parser = argparse.ArgumentParser(description="Train the medication adherence risk model.")
    parser.add_argument("--dataset", type=Path, default=None, help="Path to the Kaggle dataset file.")
    parser.add_argument(
        "--model-path",
        type=Path,
        default=None,
        help="Output path for the trained model artifact.",
    )
    parser.add_argument(
        "--model-type",
        choices=["random_forest", "xgboost"],
        default="random_forest",
        help="Classifier backend to train.",
    )
    args = parser.parse_args()

    artifact = train_model(
        dataset_path=args.dataset,
        model_path=args.model_path,
        model_type=args.model_type,
    )
    print(
        json.dumps(
            {
                "model_version": artifact["model_version"],
                "model_type": artifact["model_type"],
                "training_source": artifact["training_source"],
                "metrics": artifact["metrics"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    _main()
