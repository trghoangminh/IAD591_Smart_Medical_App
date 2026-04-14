import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../styles/theme';
import { getBasicAnalyticsAPI, getHistoryAPI, BasicAnalytics, HistoryResponse } from '../services/api';

interface DoctorPatientReportProps {
  patientId: number;
  patientName: string;
  onBack: () => void;
}

export const DoctorPatientReport: React.FC<DoctorPatientReportProps> = ({ patientId, patientName, onBack }) => {
  const [analytics, setAnalytics] = useState<BasicAnalytics | null>(null);
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [analyticsData, historyData] = await Promise.all([
          getBasicAnalyticsAPI(patientId),
          getHistoryAPI(patientId)
        ]);
        if (active) {
          setAnalytics(analyticsData);
          setHistory(historyData.slice(0, 20)); // Lấy 20 lịch sử gần nhất
        }
      } catch (err) {
        console.warn("Lỗi tải báo cáo thật:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [patientId]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại danh sách</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hồ sơ Bệnh án</Text>
        <Text style={styles.subtitle}>Sổ theo dõi thực tế của {patientName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Tỷ lệ Tổng Quan (Realtime Database)</Text>
          <Card>
            {analytics ? (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBig}>{Math.round(analytics.adherence_rate)}%</Text>
                  <Text style={styles.statLabel}>Tuân thủ</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBig, { color: theme.colors.success }]}>{analytics.taken}</Text>
                  <Text style={styles.statLabel}>Đã uống</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBig, { color: theme.colors.danger }]}>{analytics.missed}</Text>
                  <Text style={styles.statLabel}>Bỏ lỡ</Text>
                </View>
              </View>
            ) : (
              <Text style={{color: theme.colors.textMuted}}>Không thể tải dữ liệu tổng quan.</Text>
            )}
          </Card>

          <Text style={styles.sectionTitle}>Sổ Nhật Ký Gần Nhất</Text>
          <Card>
            {history.length === 0 ? (
              <Text style={{color: theme.colors.textMuted}}>Bệnh nhân chưa có lịch sử uống thuốc nào.</Text>
            ) : (
              history.map((log) => (
                <View key={log.log_id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicineName}>{log.medicine}</Text>
                    <Text style={styles.timeText}>{formatDate(log.timestamp)} (Lịch: {log.scheduled_time})</Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: log.status === 'taken' ? theme.colors.successLight : theme.colors.dangerLight }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: log.status === 'taken' ? theme.colors.success : theme.colors.danger }
                    ]}>
                      {log.status === 'taken' ? 'Đã uống' : 'Bỏ lỡ'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  backBtn: { marginBottom: 16, backgroundColor: theme.colors.primaryLight, padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  backText: { color: theme.colors.primary, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statBig: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textMain },
  statLabel: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  medicineName: { fontSize: 16, fontWeight: '600', color: theme.colors.textMain },
  timeText: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' }
});
