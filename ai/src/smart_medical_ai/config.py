from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


AI_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SMART_MEDICAL_AI_",
        case_sensitive=False,
    )

    app_name: str = "Smart Medical AI"
    api_prefix: str = "/api/analytics"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    raw_data_dir: Path = AI_DIR / "data" / "raw"
    database_path: Path = AI_DIR / "data" / "analytics.db"
    model_path: Path = AI_DIR / "src" / "smart_medical_ai" / "ml" / "saved" / "model.pkl"
    bootstrap_sample_count: int = 640
    random_state: int = 42

    def ensure_directories(self) -> None:
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.model_path.parent.mkdir(parents=True, exist_ok=True)

    def detect_dataset_path(self) -> Path | None:
        for pattern in ("*.csv", "*.xlsx", "*.xls"):
            matches = sorted(self.raw_data_dir.glob(pattern))
            if matches:
                return matches[0]
        return None


settings = Settings()
