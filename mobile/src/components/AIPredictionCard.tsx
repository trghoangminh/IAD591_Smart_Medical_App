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

const RISK_CONFIG: Record<RiskLabel, { color: string; bg: string; headerBg: string; label: string; icon: string }> = {
  low:    { color: '#1B9E5A', bg: '#E6F7EF', headerBg: '#D1F0E0', label: 'Thấp',       icon: '✓' },
  medium: { color: '#C88A00', bg: '#FEF6DC', headerBg: '#FDEFC0', label: 'Trung bình', icon: '!' },
  high:   { color: '#C0392B', bg: '#FDECEA', headerBg: '#FBCFC9', label: 'Cao',         icon: '⚠' },
};

const SEVERITY_COLOR: Record<string, string> = {
  high:       '#C0392B',
  medium:     '#C88A00',
  protective: '#1B9E5A',
};

const SEVERITY_BG: Record<string, string> = {
  high:       '#FDECEA',
  medium:     '#FEF6DC',
  protective: '#E6F7EF',
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚡</Text>
          <Text style={styles.errorTitle}>Dịch vụ tạm gián đoạn</Text>
          <Text style={styles.errorText}>
            {error ?? 'Không thể kết nối dịch vụ phân tích AI. Vui lòng thử lại sau.'}
          </Text>
        </View>
      </Card>
    );
  }

  const cfg = RISK_CONFIG[prediction.predicted_label];
  const riskPct = Math.min(100, Math.round(prediction.risk_score));

  return (
    <Card style={styles.card}>
      {/* ── Coloured header ── */}
      <View style={[styles.header, { backgroundColor: cfg.headerBg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Phân tích rủi ro AI</Text>
          <Text style={styles.headerSub}>Powered by Machine Learning</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
          <Text style={[styles.badgeIcon, { color: cfg.color }]}>{cfg.icon}</Text>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Score section ── */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreLeft}>
          <View style={[styles.scoreCircle, { borderColor: cfg.color }]}>
            <Text style={[styles.scoreNumber, { color: cfg.color }]}>{riskPct}</Text>
            <Text style={[styles.scoreUnit, { color: cfg.color }]}>/100</Text>
          </View>
        </View>
        <View style={styles.scoreRight}>
          <Text style={styles.scoreDesc}>Chỉ số rủi ro</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${riskPct}%` as any,
                  backgroundColor: cfg.color,
                },
              ]}
            />
          </View>
          <Text style={styles.probText}>
            Xác suất không tuân thủ:{' '}
            <Text style={[styles.probValue, { color: cfg.color }]}>
              {Math.round(prediction.probability_non_adherent * 100)}%
            </Text>
          </Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Top factors ── */}
      {prediction.top_factors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YẾU TỐ ẢNH HƯỞNG</Text>
          {prediction.top_factors.map((f, idx) => (
            <View
              key={idx}
              style={[
                styles.factorCard,
                { borderLeftColor: SEVERITY_COLOR[f.severity] ?? theme.colors.textLight,
                  backgroundColor: SEVERITY_BG[f.severity] ?? '#F8FAFC' },
              ]}
            >
              <View style={styles.factorHeader}>
                <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[f.severity] ?? theme.colors.textLight }]} />
                <Text style={styles.factorTitle}>{f.factor}</Text>
              </View>
              <Text style={styles.factorDetail}>{f.detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Recommendations ── */}
      {prediction.recommendations.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KHUYẾN NGHỊ</Text>
            {prediction.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recRow}>
                <View style={styles.recBullet}>
                  <Text style={styles.recBulletText}>{idx + 1}</Text>
                </View>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.modelVersion}>🤖 {prediction.model_version}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },

  /* loading */
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  loadingText: { color: theme.colors.textMuted, fontSize: 14 },

  /* error */
  errorContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  errorIcon:  { fontSize: 32, marginBottom: 8 },
  errorTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textMain, marginBottom: 4 },
  errorText:  { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20 },

  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flex: 1 },
  headerLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.textMain },
  headerSub:   { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 12, fontWeight: 'bold' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  /* score */
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  scoreLeft: { alignItems: 'center' },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  scoreUnit:   { fontSize: 11, fontWeight: '600', opacity: 0.7 },
  scoreRight:  { flex: 1 },
  scoreDesc:   { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6, fontWeight: '500' },
  progressBar: {
    height: 6,
    backgroundColor: '#E8ECF0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  probText:  { fontSize: 12, color: theme.colors.textMuted },
  probValue: { fontWeight: '700' },

  /* divider */
  divider: { height: 1, backgroundColor: '#EEF1F5', marginHorizontal: 16 },

  /* section */
  section: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  /* factor */
  factorCard: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  severityDot:  { width: 7, height: 7, borderRadius: 4 },
  factorTitle:  { fontSize: 13, fontWeight: '600', color: theme.colors.textMain, flex: 1 },
  factorDetail: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 18 },

  /* recommendations */
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  recBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  recBulletText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  recText: { flex: 1, fontSize: 13, color: theme.colors.textMain, lineHeight: 20 },

  /* footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'flex-end',
  },
  modelVersion: { fontSize: 10, color: theme.colors.textLight },
});
