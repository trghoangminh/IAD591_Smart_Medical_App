import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';

export const HomeDashboard = ({ onTakeMed }) => {
  const schedule = [
    {
      id: 1,
      name: 'Metformin (500mg)',
      instruction: '1 Viên sau khi ăn',
      time: '08:00',
      type: 'Sáng',
      status: 'taken',
    },
    {
      id: 2,
      name: 'Lisinopril (10mg)',
      instruction: '1 Viên với nước',
      time: '12:30',
      type: 'Trưa',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Atorvastatin (20mg)',
      instruction: '1 Viên trước khi ngủ',
      time: '20:00',
      type: 'Tối',
      status: 'pending',
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dateText}>Thứ Ba, 26 tháng 10</Text>
      </View>

      <Card style={styles.progressWidget}>
        <View style={styles.progressText}>
          <Text style={styles.progressTitle}>Tiến độ uống thuốc</Text>
          <Text style={styles.progressSubtitle}>Bạn đã uống 1/3 liều hôm nay. Cố gắng phát huy nhé!</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>33%</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Lịch uống hôm nay</Text>

      {schedule.map((med) => (
        <Card key={med.id} style={styles.medCard}>
          <View style={styles.medHeader}>
            <View style={[
              styles.iconBox,
              med.status === 'taken' && { backgroundColor: theme.colors.primaryLight },
              med.status === 'pending' && { backgroundColor: theme.colors.warning },
              med.status === 'missed' && { backgroundColor: theme.colors.dangerLight }
            ]}>
              <Pill
                size={24}
                color={
                  med.status === 'taken' ? theme.colors.primary :
                    med.status === 'pending' ? '#FFF' : theme.colors.danger
                }
              />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medTime}>{med.time} • {med.type}</Text>
              <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
              <Text style={styles.medInstruction}>{med.instruction}</Text>
            </View>
            <View style={styles.medStatusBox}>
              {med.status === 'taken' && (
                <View style={[styles.statusIndicator, { backgroundColor: theme.colors.primaryLight }]}>
                  <CheckCircle2 size={14} color={theme.colors.primary} />
                  <Text style={[styles.statusText, { color: theme.colors.primary }]}>Đã uống</Text>
                </View>
              )}
              {med.status === 'pending' && (
                <View style={[styles.statusIndicator, { backgroundColor: '#FFF3E0' }]}>
                  <Clock size={14} color="#F57C00" />
                  <Text style={[styles.statusText, { color: '#F57C00' }]}>Sắp tới</Text>
                </View>
              )}
            </View>
          </View>

          {med.status === 'pending' && (
            <View style={styles.medActions}>
              <Button
                variant="primary"
                onPress={() => onTakeMed(med)}
              >
                Uống ngay
              </Button>
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 100, // space for bottom nav
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  dateText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  progressSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMain,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  medCard: {
    marginBottom: theme.spacing.md,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  medName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMain,
    marginBottom: 4,
  },
  medInstruction: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  medActions: {
    marginTop: theme.spacing.md,
  }
});