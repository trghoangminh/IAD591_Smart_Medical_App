import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { Medication } from '../types';
import { User, getScheduleAPI, checkMissedSchedulesAPI } from '../services/api';
import { syncMedicationAlarms } from '../services/notifications';

interface HomeDashboardProps {
  user: User | null;
  refreshKey?: number;
  onTakeMed: (med: Medication) => void;
  onScheduleHit?: (title: string, body: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ user, refreshKey, onTakeMed, onScheduleHit }) => {
  const [schedule, setSchedule] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return;
      try {
        // Gửi lệnh giục Server dọn dẹp và gài cờ đỏ cho tất cả thuốc quá hạn 30 phút.
        await checkMissedSchedulesAPI();

        // Mới tiến hành nhặt dữ liệu về để soi UI
        const result = await getScheduleAPI(user.id);
        const mapped: Medication[] = result.map((item) => {
          let type = 'Sáng';
          const hour = parseInt(item.time.split(':')[0], 10);
          if (hour >= 12 && hour < 18) type = 'Trưa';
          else if (hour >= 18) type = 'Tối';

          return {
            id: item.schedule_id,
            name: item.medicine,
            instruction: `${item.dosage} Viên / lần`,
            time: item.time,
            type: type,
            status: item.status,
          };
        });
        setSchedule(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    // 1. Tải lần đầu tiên khi mở trang
    loadSchedule();

    // 2. Tự động soi dối chiếu Data ngầm mỗi 3 giây để làm "Ảo thuật Live Sync Live"
    const liveSyncTimer = setInterval(() => {
      loadSchedule();
    }, 3000);

    return () => clearInterval(liveSyncTimer);
  }, [user, refreshKey]);

  // Vòng lặp đếm ngược thời gian thực trên giao diện thay thế cho Push Notification Native
  const notifiedRef = React.useRef<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currTimeMinutes = now.getHours() * 60 + now.getMinutes();

      schedule.forEach((med) => {
        if (med.status !== 'pending') return;

        const [h, m] = med.time.split(':').map(Number);
        const medTimeMinutes = h * 60 + m;
        
        // Tính độ chênh lệch phút
        const diff = medTimeMinutes - currTimeMinutes;

        // Bỏ khung Sớm 5 phút cho khớp với khung Cấp báo SMS của Backend!
        if (diff >= 0 && diff <= 5 && !notifiedRef.current.has(med.id)) {
          notifiedRef.current.add(med.id);
          if (onScheduleHit) {
            onScheduleHit(
              '⏰ Sắp tới giờ uống thuốc!', 
              `Sau đây vài phút có lịch uống ${med.name}. Bạn hãy chuẩn bị sẵn nước nhé!`
            );
          }
        }
      });
    }, 5000); // Tăng tốc độ quét lên mỗi 5 giây
    return () => clearInterval(timer);
  }, [schedule]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  const total = schedule.length;
  const taken = schedule.filter((m) => m.status === 'taken').length;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{todayStr}</Text>
      </View>

      <Card style={styles.progressWidget}>
        <View style={styles.progressText}>
          <Text style={styles.progressTitle}>Tiến độ uống thuốc</Text>
          <Text style={styles.progressSubtitle}>
            {total === 0
              ? 'Bạn chưa có lịch uống thuốc nào hôm nay.'
              : `Bạn đã uống ${taken}/${total} liều hôm nay. Cố gắng phát huy nhé!`}
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Lịch uống hôm nay</Text>

      {schedule.map((med) => (
        <Card key={med.id} style={styles.medCard}>
          <View style={styles.medHeader}>
            <View
              style={[
                styles.iconBox,
                med.status === 'taken' && { backgroundColor: theme.colors.primaryLight },
                med.status === 'pending' && { backgroundColor: theme.colors.warning },
                med.status === 'missed' && { backgroundColor: theme.colors.dangerLight },
              ]}
            >
              <Pill
                size={24}
                color={
                  med.status === 'taken'
                    ? theme.colors.primary
                    : med.status === 'pending'
                    ? '#FFF'
                    : theme.colors.danger
                }
              />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medTime}>
                {med.time} • {med.type}
              </Text>
              <Text style={styles.medName} numberOfLines={1}>
                {med.name}
              </Text>
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
              {med.status === 'missed' && (
                <View style={[styles.statusIndicator, { backgroundColor: theme.colors.dangerLight }]}>
                  <XCircle size={14} color={theme.colors.danger} />
                  <Text style={[styles.statusText, { color: theme.colors.danger }]}>Đã qua hạn</Text>
                </View>
              )}
            </View>
          </View>

          {med.status === 'pending' && (
            <View style={styles.medActions}>
              <Button variant="primary" onPress={() => onTakeMed(med)}>
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
    paddingBottom: 100,
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
  medStatusBox: {
    alignSelf: 'flex-start',
    marginLeft: theme.spacing.xs,
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
  },
});
