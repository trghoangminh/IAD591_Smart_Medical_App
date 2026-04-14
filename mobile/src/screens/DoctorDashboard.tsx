import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { Users, Phone, User as UserIcon, Calendar, Activity } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { User, getDoctorPatientsAPI, PatientResponse, checkMissedSchedulesAPI } from '../services/api';

interface DoctorDashboardProps {
  user: User;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user }) => {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedPatientId, setExpandedPatientId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedPatientId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    // Chạy CronJob giả lập: Kiểm tra các bệnh nhân quên thuốc
    checkMissedSchedulesAPI();

    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await getDoctorPatientsAPI(user.id);
        setPatients(data);
      } catch (e) {
        console.warn(e);
      } finally {
        setTimeout(() => setLoading(false), 100);
      }
    };
    loadPatients();
  }, [user]);

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return theme.colors.success;
    if (rate >= 50) return '#F59E0B';
    return theme.colors.danger;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user.name} 👋</Text>
          <Text style={styles.subtitle}>Tổng hợp tình trạng bệnh nhân</Text>
        </View>
        <Card style={styles.statsCard}>
          <Users size={24} color={theme.colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statsCount}>{patients.length}</Text>
            <Text style={styles.statsLabel}>Bệnh nhân</Text>
          </View>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Danh sách bệnh nhân</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : patients.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
          <Users size={48} color={theme.colors.textMuted} />
          <Text style={{ fontSize: 16, color: theme.colors.textMuted, marginTop: 16 }}>Chưa có bệnh nhân nào</Text>
        </View>
      ) : (
        patients.map((p) => (
          <Card key={p.id} style={styles.patientCard}>
            <TouchableOpacity onPress={() => toggleExpand(p.id)} activeOpacity={0.7}>
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <UserIcon size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <View style={styles.phoneBox}>
                    <Phone size={12} color={theme.colors.textLight} />
                    <Text style={styles.patientPhone}>{p.phone}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={styles.statLabelRow}>
                    <Calendar size={14} color={theme.colors.textLight} />
                    <Text style={styles.statLabel}>Đơn thuốc</Text>
                  </View>
                  <Text style={styles.statValue}>{p.prescriptions_count} đang dùng</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={styles.statLabelRow}>
                    <Activity size={14} color={theme.colors.textLight} />
                    <Text style={styles.statLabel}>Mức tuân thủ</Text>
                  </View>
                  <Text style={[styles.statValue, { color: getAdherenceColor(p.adherence_rate), fontWeight: 'bold' }]}>
                    {p.adherence_rate}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {expandedPatientId === p.id && (
              <View style={styles.prescriptionsContainer}>
                <View style={styles.divider} />
                <Text style={styles.prescriptionsTitle}>Đơn thuốc đang dùng</Text>
                {p.prescriptions && p.prescriptions.length > 0 ? (
                  p.prescriptions.map((pres) => (
                    <View key={pres.id} style={styles.prescriptionItem}>
                      <View style={styles.presLeft}>
                        <Text style={styles.presName}>{pres.medicine}</Text>
                        <Text style={styles.presDosage}>{pres.dosage} liều/lần</Text>
                      </View>
                      <View style={styles.presRight}>
                        <Text style={styles.presTime}>{pres.times.length > 0 ? pres.times.join(' - ') : 'Chưa có giờ'}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{color: theme.colors.textMuted, fontSize: 13, marginTop: 8}}>Không có đơn thuốc nào.</Text>
                )}
              </View>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  greeting: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4, marginBottom: 16 },
  statsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 16 },
  statsCount: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  statsLabel: { fontSize: 13, color: theme.colors.textMain },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: theme.spacing.md,
  },
  patientCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.md },
  patientHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  patientPhone: { fontSize: 13, color: theme.colors.textLight },
  divider: { height: 1, backgroundColor: '#F0F6F9' },
  statsRow: { flexDirection: 'row', padding: 16 },
  statBox: { flex: 1 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statLabel: { fontSize: 13, color: theme.colors.textLight },
  statValue: { fontSize: 15, color: theme.colors.textMain, fontWeight: '500' },
  prescriptionsContainer: { backgroundColor: '#FAFAFA', paddingBottom: 16 },
  prescriptionsTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textMain, marginTop: 12, marginLeft: 16, marginBottom: 8 },
  prescriptionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  presLeft: { flex: 1 },
  presName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  presDosage: { fontSize: 12, color: theme.colors.textLight },
  presRight: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  presTime: { fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' },
});
