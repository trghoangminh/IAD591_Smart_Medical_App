from __future__ import annotations

import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from smart_medical_ai.models.chat import ChatStreamRequest
from smart_medical_ai.services.chat_chain import chat_chain_service
from smart_medical_ai.services.chat_context import PatientRoleError, UserNotFoundError

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(data: dict) -> bytes:
    """Format một SSE event: data: {...}\\n\\n"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


@router.post("/stream")
async def chat_stream(payload: ChatStreamRequest) -> StreamingResponse:
    """
    Streaming chatbot y tế dành riêng cho bệnh nhân.

    Trả về SSE stream với các event:
    - `{"token": "..."}` — từng token từ Gemini
    - `{"done": true}` — kết thúc stream
    - `{"error": "...", "code": "..."}` — lỗi

    Chỉ user có role = "patient" mới được gọi endpoint này.
    """
    # ── Pre-check role trước khi mở stream → trả HTTP lỗi thẳng ──
    try:
        user = chat_chain_service._context_service._repo.fetch_user(payload.user_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if user is None:
        raise HTTPException(status_code=404, detail="User không tồn tại.")
    if user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Tính năng tư vấn AI chỉ dành cho bệnh nhân.",
        )

    # ── SSE generator ──
    async def event_source() -> AsyncIterator[bytes]:
        try:
            async for token in chat_chain_service.stream_answer(
                user_id=payload.user_id,
                message=payload.message,
                history=payload.history,
            ):
                yield _sse({"token": token})
            yield _sse({"done": True})

        except (UserNotFoundError, PatientRoleError) as exc:
            # Không nên xảy ra sau pre-check, nhưng phòng race condition
            log.warning("chat_stream guard failed: %s", exc)
            yield _sse({"error": str(exc), "code": "forbidden"})

        except RuntimeError as exc:
            # Thiếu API key
            log.error("chat_stream runtime error: %s", exc)
            yield _sse({"error": "Dịch vụ AI chưa được cấu hình.", "code": "config_error"})

        except Exception as exc:
            log.exception("chat_stream unexpected error for user %d", payload.user_id)
            yield _sse({"error": "Đã xảy ra lỗi, vui lòng thử lại.", "code": "server_error"})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
