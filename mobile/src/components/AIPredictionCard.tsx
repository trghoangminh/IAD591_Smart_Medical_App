import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from './Card';
import { theme } from '../styles/theme';
import { PredictionResponse, RiskLabel } from '../services/analytics';

interface AIPredictionCardProps {
  prediction: PredictionResponse | null;
  loading: boolean;
  error: string | null;
}

const RISK_CONFIG: Record<RiskLabel, { color: string; bg: string; label: string }> = {
  low:    { color: theme.colors.success,  bg: '#E8F8EF', label: 'Thấp' },
  medium: { color: theme.colors.warning,  bg: '#FEF9E7', label: 'Trung bình' },
  high:   { color: theme.colors.danger,   bg: theme.colors.dangerLight, label: 'Cao' },
};

const SEVERITY_COLOR: Record<string, string> = {
  high:       theme.colors.danger,
  medium:     theme.colors.warning,
  protective: theme.colors.success,
};

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({ prediction, loading, error }) => {
  if (loading) {
    return (
      <Card>
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang phân tích rủi ro AI...</Text>
        </View>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card>
        <Text style={styles.errorText}>
          {error ?? 'Dịch vụ phân tích AI đang tạm ngắt, vui lòng thử lại sau.'}
        </Text>
      </Card>
    );
  }

  const cfg = RISK_CONFIG[prediction.predicted_label];

  return (
    <Card>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Phân tích rủi ro AI</Text>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNumber, { color: cfg.color }]}>
          {Math.round(prediction.risk_score)}
        </Text>
        <Text style={styles.scoreUnit}>/100</Text>
        <Text style={styles.scoreLabel}>
          {'  '}Xác suất không tuân thủ: {Math.round(prediction.probability_non_adherent * 100)}%
        </Text>
      </View>

      {/* Top factors */}
      {prediction.top_factors.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Yếu tố ảnh hưởng</Text>
          {prediction.top_factors.map((f, idx) => (
            <View key={idx} style={styles.factorRow}>
              <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[f.severity] ?? theme.colors.textMuted }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.factorTitle}>{f.factor}</Text>
                <Text style={styles.factorDetail}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Recommendations */}
      {prediction.recommendations.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Khuyến nghị</Text>
          {prediction.recommendations.map((rec, idx) => (
            <Text key={idx} style={styles.recText}>• {rec}</Text>
          ))}
        </>
      )}

      <Text style={styles.modelVersion}>Model: {prediction.model_version}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: theme.colors.textMuted, fontSize: 14 },
  errorText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  scoreNumber: { fontSize: 40, fontWeight: 'bold' },
  scoreUnit: { fontSize: 18, color: theme.colors.textMuted, marginLeft: 2 },
  scoreLabel: { fontSize: 13, color: theme.colors.textMuted, flex: 1, flexWrap: 'wrap' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textLight, marginBottom: 8, marginTop: 4 },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  factorTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textMain },
  factorDetail: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  recText: { fontSize: 13, color: theme.colors.textMain, marginBottom: 6, lineHeight: 20 },
  modelVersion: { fontSize: 11, color: theme.colors.textLight, marginTop: 12, textAlign: 'right' },
});
