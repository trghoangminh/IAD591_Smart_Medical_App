from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime

from smart_medical_ai.models.chat import LogRow, PrescriptionRow, UserRow
from smart_medical_ai.repos.backend_db import BackendDatabaseRepository

log = logging.getLogger(__name__)


# ─── Exceptions ───────────────────────────────────────────────────────────────


class UserNotFoundError(Exception):
    """User không tồn tại trong DB."""


class PatientRoleError(Exception):
    """User không phải patient role."""


# ─── Data container ───────────────────────────────────────────────────────────


@dataclass
class PatientContext:
    user: UserRow
    caretaker: UserRow | None
    prescriptions: list[PrescriptionRow] = field(default_factory=list)
    logs: list[LogRow] = field(default_factory=list)


# ─── Service ──────────────────────────────────────────────────────────────────


class ChatContextService:
    """Build context bệnh nhân để inject vào system prompt."""

    def __init__(self, repository: BackendDatabaseRepository | None = None) -> None:
        self._repo = repository or BackendDatabaseRepository()

    def build_patient_context(self, user_id: int) -> PatientContext:
        """Fetch dữ liệu bệnh nhân; raise nếu không tồn tại hoặc sai role."""
        user = self._repo.fetch_user(user_id)
        if user is None:
            raise UserNotFoundError(f"User {user_id} không tồn tại.")
        if user.role != "patient":
            raise PatientRoleError(
                f"User {user_id} có role '{user.role}', không phải 'patient'."
            )

        caretaker: UserRow | None = None
        if user.caretaker_id:
            caretaker = self._repo.fetch_caretaker(user.caretaker_id)

        today = date.today()
        prescriptions = self._repo.fetch_active_prescriptions(user_id, today)
        logs = self._repo.fetch_recent_logs(user_id)

        return PatientContext(
            user=user,
            caretaker=caretaker,
            prescriptions=prescriptions,
            logs=logs,
        )

    # ──────────────────────────────────────────────────────────────────────────

    def format_context_vi(self, ctx: PatientContext) -> str:
        """Render PatientContext thành chuỗi tiếng Việt cho system prompt."""
        lines: list[str] = []

        # ── Thông tin bệnh nhân ──
        lines.append("[HỒ SƠ BỆNH NHÂN]")
        lines.append(f"- Họ tên: {ctx.user.name}")

        age_str = _calc_age_str(ctx.user.birth_date)
        gender_str = _gender_vi(ctx.user.gender)
        if age_str:
            lines.append(f"- Tuổi: {age_str}")
        if gender_str:
            lines.append(f"- Giới tính: {gender_str}")
        if ctx.user.phone:
            lines.append(f"- Điện thoại: {ctx.user.phone}")

        if ctx.caretaker:
            role_vi = "Bác sĩ phụ trách" if ctx.caretaker.role == "doctor" else "Người chăm sóc"
            lines.append(
                f"- {role_vi}: {ctx.caretaker.name}"
                + (f" (SĐT: {ctx.caretaker.phone})" if ctx.caretaker.phone else "")
            )

        # ── Đơn thuốc đang dùng ──
        lines.append("")
        lines.append("[ĐƠN THUỐC ĐANG DÙNG]")
        if not ctx.prescriptions:
            lines.append("- Hiện chưa có đơn thuốc active.")
        else:
            for i, pres in enumerate(ctx.prescriptions, 1):
                times_str = ", ".join(pres.times) if pres.times else "chưa rõ"
                end_str = pres.end_date if pres.end_date else "hiện tại"
                lines.append(
                    f"{i}. {pres.medicine} — {pres.dosage} viên/lần, "
                    f"lịch uống: {times_str}, "
                    f"từ {pres.start_date or '?'} đến {end_str}"
                )

        # ── Nhật ký tuân thủ ──
        lines.append("")
        lines.append(f"[NHẬT KÝ {_get_history_days(ctx.logs)} NGÀY QUA]")
        if not ctx.logs:
            lines.append("- Chưa có dữ liệu uống thuốc được ghi nhận.")
        else:
            taken = sum(1 for l in ctx.logs if l.status == "taken")
            missed = len(ctx.logs) - taken
            rate = round(taken / len(ctx.logs) * 100) if ctx.logs else 0
            lines.append(f"- Tổng liều ghi nhận: {len(ctx.logs)}")
            lines.append(f"- Đã uống: {taken} ({rate}%) | Bỏ lỡ: {missed}")

            # Thuốc bị bỏ nhiều nhất
            missed_by_med: dict[str, int] = {}
            for lg in ctx.logs:
                if lg.status == "missed":
                    missed_by_med[lg.medicine] = missed_by_med.get(lg.medicine, 0) + 1
            if missed_by_med:
                top = sorted(missed_by_med.items(), key=lambda x: x[1], reverse=True)[:3]
                top_str = ", ".join(f"{m} ({n} lần)" for m, n in top)
                lines.append(f"- Bỏ lỡ nhiều nhất: {top_str}")

        return "\n".join(lines)


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _calc_age_str(birth_date: str | None) -> str:
    """Tính tuổi từ chuỗi YYYY-MM-DD."""
    if not birth_date:
        return ""
    try:
        dob = date.fromisoformat(birth_date)
        age = (date.today() - dob).days // 365
        return str(max(0, age))
    except ValueError:
        return ""


def _gender_vi(gender: str | None) -> str:
    mapping = {"male": "Nam", "female": "Nữ", "other": "Khác"}
    return mapping.get(gender or "", "")


def _get_history_days(logs: list[LogRow]) -> int:
    """Số ngày có log thực tế (tối đa 14)."""
    if not logs:
        return 14
    try:
        oldest = min(datetime.fromisoformat(lg.timestamp) for lg in logs)
        days = max(1, (datetime.utcnow() - oldest).days + 1)
        return min(days, 14)
    except Exception:
        return 14


# Singleton
chat_context_service = ChatContextService()
