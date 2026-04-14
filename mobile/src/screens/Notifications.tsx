import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { NotificationAlert, AlertType } from '../types';
import { User, getNotificationsAPI } from '../services/api';

interface NotificationsProps {
  user: User;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await getNotificationsAPI(user.id);
        
        // Suy diễn icon theo message
        const mapped: NotificationAlert[] = data.map((alert) => {
           let t: AlertType = 'info';
           const text = alert.message.toLowerCase();
           if (text.includes('quên') || text.includes('bỏ lỡ') || text.includes('trễ')) t = 'warning';
           if (text.includes('thành công') || text.includes('làm tốt')) t = 'success';
           
           const d = new Date(alert.timestamp);
           const diffMs = new Date().getTime() - d.getTime();
           const diffMins = Math.floor(diffMs / 60000);
           let timeStr = 'Vừa xong';
           if (diffMins >= 1440) timeStr = `${Math.floor(diffMins / 1440)} ngày trước`;
           else if (diffMins >= 60) timeStr = `${Math.floor(diffMins / 60)} giờ trước`;
           else if (diffMins > 0) timeStr = `${diffMins} phút trước`;

           return {
             id: alert.id,
             title: t === 'warning' ? 'Cảnh báo bỏ lỡ' : t === 'success' ? 'Thông báo tốt' : 'Hệ thống SmartMed',
             message: alert.message,
             type: t,
             time: timeStr
           };
        });
        setAlerts(mapped);
      } catch (err) {
        console.warn('Lỗi gọi API Notification', err);
      } finally {
        setTimeout(() => setLoading(false), 100);
      }
    };
    fetchNotifications();
  }, [user]);

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

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : alerts.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
          <Bell size={48} color={theme.colors.textMuted} />
          <Text style={{ fontSize: 16, color: theme.colors.textMuted, marginTop: 16 }}>Không có thông báo mới nào</Text>
        </View>
      ) : (
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
      )}
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
