// ─── Medication ───────────────────────────────────────────────────────────────

export type MedicationStatus = 'taken' | 'pending' | 'missed';

export interface Medication {
  id: number;
  name: string;
  instruction: string;
  time: string;
  type: string;
  status: MedicationStatus;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type AlertType = 'warning' | 'info' | 'success';

export interface NotificationAlert {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  time: string;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: number;
  time: string;
  scheduled: string;
  name: string;
  status: MedicationStatus;
  date: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface WeeklyData {
  day: string;
  percentage: number;
}

export type AnalyticsPeriod = 'week' | 'month';
export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface AnalyticsOverview {
  patient_id: string;
  period: AnalyticsPeriod;
  total_doses: number;
  taken_doses: number;
  missed_doses: number;
  delayed_doses: number;
  adherence_rate: number;
  average_delay_minutes: number;
  current_risk_score: number;
  trend_direction: TrendDirection;
}

export interface AnalyticsChartPoint {
  label: string;
  adherence_rate: number;
  taken_doses: number;
  missed_doses: number;
}

export interface TopMissedMedication {
  medication_name: string;
  missed_doses: number;
  adherence_rate: number;
}

export interface AnalyticsChartsResponse {
  patient_id: string;
  period: AnalyticsPeriod;
  series: AnalyticsChartPoint[];
  top_missed_medications: TopMissedMedication[];
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type TabId = 'home' | 'analytics' | 'scan' | 'history' | 'profile';
