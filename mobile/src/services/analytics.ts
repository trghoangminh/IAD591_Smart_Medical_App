declare const process: {
  env: Record<string, string | undefined>;
};

import { AnalyticsChartsResponse, AnalyticsOverview, AnalyticsPeriod } from '../types';

const DEFAULT_AI_API_URL = 'http://127.0.0.1:8000';

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

export const fetchAnalyticsOverview = async (period: AnalyticsPeriod): Promise<AnalyticsOverview> =>
  request<AnalyticsOverview>(`/api/analytics/overview?patient_id=demo-patient&period=${period}`);

export const fetchAnalyticsCharts = async (period: AnalyticsPeriod): Promise<AnalyticsChartsResponse> =>
  request<AnalyticsChartsResponse>(`/api/analytics/charts?patient_id=demo-patient&period=${period}`);
