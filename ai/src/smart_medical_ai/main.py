from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from smart_medical_ai.config import settings
from smart_medical_ai.routers.analytics import router as analytics_router
from smart_medical_ai.routers.chat import router as chat_router
from smart_medical_ai.services.predictor import predictor_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.ensure_directories()
    predictor_service.ensure_ready()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analytics_router)
app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model_path": str(settings.model_path),
        "dataset_path": str(settings.detect_dataset_path() or "synthetic-bootstrap"),
    }
