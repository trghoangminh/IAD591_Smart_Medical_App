import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../styles/theme';
import { AnalyticsChartsResponse, AnalyticsOverview, AnalyticsPeriod, WeeklyData } from '../types';
import { analyticsApiBaseUrl, fetchAnalyticsCharts, fetchAnalyticsOverview } from '../services/analytics';

const FILTER_OPTIONS = ['Tuần', 'Tháng'] as const;
type FilterLabel = (typeof FILTER_OPTIONS)[number];

const FILTER_TO_PERIOD: Record<FilterLabel, AnalyticsPeriod> = {
  Tuần: 'week',
  Tháng: 'month',
};

const TREND_LABELS = {
  improving: 'Cải thiện',
  stable: 'Ổn định',
  declining: 'Giảm',
} as const;

const fallbackOverviewData: Record<AnalyticsPeriod, AnalyticsOverview> = {
  week: {
    patient_id: 'demo-patient',
    period: 'week',
    total_doses: 21,
    taken_doses: 16,
    missed_doses: 5,
    delayed_doses: 3,
    adherence_rate: 76,
    average_delay_minutes: 18,
    current_risk_score: 34,
    trend_direction: 'stable',
  },
  month: {
    patient_id: 'demo-patient',
    period: 'month',
    total_doses: 92,
    taken_doses: 74,
    missed_doses: 18,
    delayed_doses: 11,
    adherence_rate: 80.4,
    average_delay_minutes: 21,
    current_risk_score: 29,
    trend_direction: 'improving',
  },
};

const fallbackChartsData: Record<AnalyticsPeriod, AnalyticsChartsResponse> = {
  week: {
    patient_id: 'demo-patient',
    period: 'week',
    series: [
      { label: 'T2', adherence_rate: 100, taken_doses: 3, missed_doses: 0 },
      { label: 'T3', adherence_rate: 66, taken_doses: 2, missed_doses: 1 },
      { label: 'T4', adherence_rate: 100, taken_doses: 3, missed_doses: 0 },
      { label: 'T5', adherence_rate: 0, taken_doses: 0, missed_doses: 3 },
      { label: 'T6', adherence_rate: 33, taken_doses: 1, missed_doses: 2 },
      { label: 'T7', adherence_rate: 100, taken_doses: 3, missed_doses: 0 },
      { label: 'CN', adherence_rate: 80, taken_doses: 4, missed_doses: 1 },
    ],
    top_missed_medications: [
      { medication_name: 'Prednisone', missed_doses: 3, adherence_rate: 62 },
      { medication_name: 'Metformin', missed_doses: 2, adherence_rate: 75 },
      { medication_name: 'Amlodipine', missed_doses: 1, adherence_rate: 89 },
    ],
  },
  month: {
    patient_id: 'demo-patient',
    period: 'month',
    series: [
      { label: 'Tuần 1', adherence_rate: 72, taken_doses: 18, missed_doses: 7 },
      { label: 'Tuần 2', adherence_rate: 78, taken_doses: 20, missed_doses: 5 },
      { label: 'Tuần 3', adherence_rate: 83, taken_doses: 20, missed_doses: 4 },
      { label: 'Tuần 4', adherence_rate: 86, taken_doses: 18, missed_doses: 3 },
      { label: 'Tuần 5', adherence_rate: 80, taken_doses: 8, missed_doses: 2 },
    ],
    top_missed_medications: [
      { medication_name: 'Prednisone', missed_doses: 7, adherence_rate: 68 },
      { medication_name: 'Metformin', missed_doses: 6, adherence_rate: 79 },
      { medication_name: 'Amlodipine', missed_doses: 5, adherence_rate: 84 },
    ],
  },
};

export const Analytics: React.FC = () => {
  const [filter, setFilter] = useState<FilterLabel>('Tuần');
  const [overview, setOverview] = useState<AnalyticsOverview>(fallbackOverviewData.week);
  const [charts, setCharts] = useState<AnalyticsChartsResponse>(fallbackChartsData.week);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Đang tải dữ liệu AI...');

  const period = FILTER_TO_PERIOD[filter];

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [nextOverview, nextCharts] = await Promise.all([
          fetchAnalyticsOverview(period),
          fetchAnalyticsCharts(period),
        ]);

        if (!active) return;
        setOverview(nextOverview);
        setCharts(nextCharts);
        setUsingFallback(false);
        setStatusMessage(`AI API: ${analyticsApiBaseUrl}`);
      } catch {
        if (!active) return;
        setOverview(fallbackOverviewData[period]);
        setCharts(fallbackChartsData[period]);
        setUsingFallback(true);
        setStatusMessage('Không kết nối được AI API, đang hiển thị dữ liệu demo.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, [period]);

  const chartData: WeeklyData[] = charts.series.map((point) => ({
    day: point.label,
    percentage: Math.round(point.adherence_rate),
  }));

  const totalDoses = overview.total_doses;
  const takenDoses = overview.taken_doses;
  const missedDoses = overview.missed_doses;
  const takenPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const missedPercent = totalDoses > 0 ? Math.round((missedDoses / totalDoses) * 100) : 0;
  const trendLabel = TREND_LABELS[overview.trend_direction];
  const takenFlex = totalDoses > 0 ? takenDoses : 1;
  const missedFlex = totalDoses > 0 ? missedDoses : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo & Phân tích</Text>
        <Text style={styles.subtitle}>Theo dõi tiến độ uống thuốc của bạn</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Tổng quan</Text>
      <Card>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{takenPercent}%</Text>
            <Text style={styles.statLabel}>Tuân thủ</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statBig, { color: theme.colors.success }]}>{takenDoses}</Text>
            <Text style={styles.statLabel}>Đã uống</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statBig, { color: theme.colors.danger }]}>{missedDoses}</Text>
            <Text style={styles.statLabel}>Bỏ lỡ</Text>
          </View>
        </View>

        <View style={styles.segmentedBar}>
          <View style={[styles.segment, { flex: takenFlex, backgroundColor: theme.colors.success }]} />
          <View style={[styles.segment, { flex: missedFlex, backgroundColor: theme.colors.danger }]} />
        </View>
        <View style={styles.segmentLegend}>
          <Text style={styles.segmentLegendTaken}>Đã uống ({takenPercent}%)</Text>
          <Text style={styles.segmentLegendMissed}>Bỏ lỡ ({missedPercent}%)</Text>
        </View>

        <View style={styles.insightRow}>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>{Math.round(overview.current_risk_score)}%</Text>
            <Text style={styles.insightLabel}>Risk score</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>{Math.round(overview.average_delay_minutes)}p</Text>
            <Text style={styles.insightLabel}>Trễ trung bình</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightValue}>{trendLabel}</Text>
            <Text style={styles.insightLabel}>Xu hướng</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Phân tích theo ngày (Biểu đồ)</Text>
      <Card>
        <View style={styles.chartContainer}>
          {chartData.map((d, i) => {
            const isCritical = d.percentage === 0;
            return (
              <View key={i} style={styles.barColumn}>
                <View
                  style={[
                    styles.barTrack,
                    isCritical && { borderColor: theme.colors.danger, borderWidth: 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${d.percentage}%` as `${number}%`,
                        backgroundColor:
                          d.percentage === 100
                            ? theme.colors.primary
                            : d.percentage > 50
                              ? theme.colors.warning
                              : theme.colors.danger,
                      },
                    ]}
                  />
                  {isCritical && (
                    <Text
                      style={{
                        position: 'absolute',
                        top: -16,
                        color: theme.colors.danger,
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      !!
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    isCritical && { color: theme.colors.danger, fontWeight: 'bold' },
                  ]}
                  numberOfLines={1}
                >
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Thuốc hay bị quên</Text>
      <Card>
        {charts.top_missed_medications.length === 0 ? (
          <Text style={styles.emptyState}>Chưa có dữ liệu thuốc bị quên trong giai đoạn này.</Text>
        ) : (
          charts.top_missed_medications.map((item) => (
            <View key={item.medication_name} style={styles.medicationRow}>
              <View>
                <Text style={styles.medicationName}>{item.medication_name}</Text>
                <Text style={styles.medicationSubtext}>Tuân thủ {Math.round(item.adherence_rate)}%</Text>
              </View>
              <View style={styles.medicationBadge}>
                <Text style={styles.medicationBadgeText}>{item.missed_doses} liều quên</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusPill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillWarning: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusPillText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  statusPillTextWarning: {
    color: theme.colors.danger,
  },
  statusMessage: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { color: theme.colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { alignItems: 'center', flex: 1 },
  statBig: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textMain },
  statLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  segmentedBar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  segmentLegend: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  segmentLegendTaken: { fontSize: 12, color: theme.colors.success, fontWeight: 'bold' },
  segmentLegendMissed: { fontSize: 12, color: theme.colors.danger, fontWeight: 'bold' },
  segment: { height: '100%' },
  insightRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  insightBox: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.textMain,
  },
  insightLabel: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  barColumn: { alignItems: 'center', height: '100%', flex: 1 },
  barTrack: {
    flex: 1,
    width: 24,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: { width: '100%', borderRadius: 12, alignSelf: 'flex-end' },
  dayLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 8 },
  medicationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  medicationName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  medicationSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  medicationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.dangerLight,
  },
  medicationBadgeText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
  },
});
