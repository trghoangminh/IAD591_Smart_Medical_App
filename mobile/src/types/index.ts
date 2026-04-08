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

// ─── Navigation ───────────────────────────────────────────────────────────────

export type TabId = 'home' | 'analytics' | 'scan' | 'history' | 'profile';
