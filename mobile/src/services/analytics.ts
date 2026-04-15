declare const process: {
  env: Record<string, string | undefined>;
};

import { AnalyticsChartsResponse, AnalyticsOverview, AnalyticsPeriod } from '../types';
import { MLFeatures } from './api';

const DEFAULT_AI_API_URL = 'http://127.0.0.1:8001';

export const analyticsApiBaseUrl = (
  process.env.EXPO_PUBLIC_AI_API_URL ?? DEFAULT_AI_API_URL
).replace(/\/$/, '');

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${analyticsApiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Analytics API returned ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchAnalyticsOverview = async (
  period: AnalyticsPeriod,
  patientId: string = 'demo-patient'
): Promise<AnalyticsOverview> =>
  request<AnalyticsOverview>(`/api/analytics/overview?patient_id=${patientId}&period=${period}`);

export const fetchAnalyticsCharts = async (
  period: AnalyticsPeriod,
  patientId: string = 'demo-patient'
): Promise<AnalyticsChartsResponse> =>
  request<AnalyticsChartsResponse>(`/api/analytics/charts?patient_id=${patientId}&period=${period}`);

// ─── AI Prediction ──────────────────────────────────────────────────────────

export type RiskSeverity = 'high' | 'medium' | 'protective';
export type RiskLabel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  factor: string;
  severity: RiskSeverity;
  detail: string;
}

export interface PredictionResponse {
  patient_id: string;
  medication_name: string;
  risk_score: number;
  probability_non_adherent: number;
  predicted_label: RiskLabel;
  top_factors: RiskFactor[];
  recommendations: string[];
  model_version: string;
}

export const predictAdherence = async (features: MLFeatures): Promise<PredictionResponse> => {
  const response = await fetch(`${analyticsApiBaseUrl}/api/analytics/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  });
  if (!response.ok) {
    throw new Error(`AI Prediction API returned ${response.status}`);
  }
  return (await response.json()) as PredictionResponse;
};
