import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/Card';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';

export const Notifications = () => {
  const alerts = [
    { id: 1, type: 'warning', title: 'Missed Dose', message: 'You may have missed your 12:30 PM Lisinopril.', time: '1 hr ago' },
    { id: 2, type: 'info', title: 'Refill Reminder', message: 'You have only 5 days left for Metformin.', time: '5 hrs ago' },
    { id: 3, type: 'success', title: 'Weekly Goal Met', message: 'Great job! 100% adherence this week.', time: '1 day ago' },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle size={24} color={theme.colors.danger} />;
      case 'success': return <CheckCircle size={24} color={theme.colors.success} />;
      default: return <Bell size={24} color={theme.colors.primary} />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'warning': return theme.colors.dangerLight;
      case 'success': return '#E8F5E9';
      default: return theme.colors.primaryLight;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
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
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  alertMsg: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 8 },
  time: { fontSize: 12, color: theme.colors.textLight }
});
