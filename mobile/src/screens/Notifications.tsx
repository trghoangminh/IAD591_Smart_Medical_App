import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/Card';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { NotificationAlert, AlertType } from '../types';

export const Notifications: React.FC = () => {
  const alerts: NotificationAlert[] = [
    {
      id: 1,
      type: 'warning',
      title: 'Bỏ lỡ liều',
      message: 'Bạn có thể đã quên uống Lisinopril lúc 12:30.',
      time: '1 giờ trước',
    },
    {
      id: 2,
      type: 'info',
      title: 'Nhắc nhở nạp thêm',
      message: 'Bạn chỉ còn 5 ngày thuốc Metformin.',
      time: '5 giờ trước',
    },
    {
      id: 3,
      type: 'success',
      title: 'Đạt mục tiêu tuần',
      message: 'Làm tốt lắm! Bạn đã tuân thủ 100% trong tuần này.',
      time: '1 ngày trước',
    },
  ];

  const getIcon = (type: AlertType): React.ReactNode => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} color={theme.colors.danger} />;
      case 'success':
        return <CheckCircle size={24} color={theme.colors.success} />;
      default:
        return <Bell size={24} color={theme.colors.primary} />;
    }
  };

  const getBgColor = (type: AlertType): string => {
    switch (type) {
      case 'warning':
        return theme.colors.dangerLight;
      case 'success':
        return '#E8F5E9';
      default:
        return theme.colors.primaryLight;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
      </View>

      <View style={styles.list}>
        {alerts.map((alert) => (
          <Card key={alert.id} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: getBgColor(alert.type) }]}>
              {getIcon(alert.type)}
            </View>
            <View style={styles.info}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMsg}>{alert.message}</Text>
              <Text style={styles.time}>{alert.time}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  list: {},
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  alertMsg: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 8 },
  time: { fontSize: 12, color: theme.colors.textLight },
});
