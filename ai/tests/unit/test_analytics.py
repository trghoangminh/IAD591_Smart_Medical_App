from __future__ import annotations

from smart_medical_ai.repos.database import DatabaseRepository
from smart_medical_ai.services.analytics import AnalyticsService


def test_analytics_returns_seeded_overview_and_chart_data(tmp_path):
    repository = DatabaseRepository(database_path=tmp_path / "analytics.db")
    service = AnalyticsService(repository=repository)

    overview = service.get_overview(patient_id="demo-patient", period="week")
    charts = service.get_charts(patient_id="demo-patient", period="week")
    monthly_charts = service.get_charts(patient_id="demo-patient", period="month")

    assert overview.total_doses > 0
    assert 0.0 <= overview.adherence_rate <= 100.0
    assert len(charts.series) == 7
    assert 4 <= len(monthly_charts.series) <= 6
    assert charts.top_missed_medications
