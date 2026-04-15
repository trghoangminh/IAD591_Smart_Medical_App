from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Một lượt hội thoại giữa user và assistant."""

    role: Literal["user", "assistant"]
    content: str


class ChatStreamRequest(BaseModel):
    """Request body cho endpoint /api/chat/stream."""

    user_id: int = Field(..., ge=1)
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


# ─── Row models (map schema smart_medicine.db) ───────────────────────────────


class UserRow(BaseModel):
    id: int
    name: str
    role: str
    phone: str | None = None
    email: str | None = None
    caretaker_id: int | None = None
    birth_date: str | None = None
    gender: str | None = None


class PrescriptionRow(BaseModel):
    id: int
    user_id: int
    medicine: str
    dosage: int
    start_date: str | None = None
    end_date: str | None = None
    times: list[str] = Field(default_factory=list)  # populated from schedules


class LogRow(BaseModel):
    medicine: str
    status: str  # "taken" | "missed"
    scheduled_time: str
    timestamp: str
