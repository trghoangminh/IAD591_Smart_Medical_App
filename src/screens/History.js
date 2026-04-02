import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';

export const History = () => {
  const [filter, setFilter] = useState('Hôm nay'); // Today, 7 Days, 30 Days

  const timeline = [
    { id: 1, time: '12:35 PM', scheduled: '12:30 PM', name: 'Lisinopril (10mg)', status: 'taken', date: 'Hôm nay' },
    { id: 2, time: '08:05 AM', scheduled: '08:00 AM', name: 'Metformin (500mg)', status: 'taken', date: 'Hôm nay' },
    { id: 3, time: '09:00 PM', scheduled: '08:00 PM', name: 'Atorvastatin (20mg)', status: 'missed', date: 'Hôm qua' },
    { id: 4, time: '12:30 PM', scheduled: '12:30 PM', name: 'Lisinopril (10mg)', status: 'taken', date: 'Hôm qua' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử</Text>
        <Text style={styles.subtitle}>Theo dõi lịch sử uống thuốc</Text>
      </View>

      <View style={styles.filterRow}>
        {['Hôm nay', '7 Ngày', '30 Ngày'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timelineContainer}>
        {timeline.map((item, index) => (
          <View key={item.id} style={styles.timelineItem}>
            {/* The line connector */}
            {index !== timeline.length - 1 && <View style={styles.line} />}
            
            <View style={styles.statusDot}>
              {item.status === 'taken' ? (
                <CheckCircle2 size={24} color={theme.colors.success} />
              ) : (
                <XCircle size={24} color={theme.colors.danger} />
              )}
            </View>

            <Card style={styles.timelineCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.actualTime}>Đã uống: {item.time}</Text>
                <Text style={styles.scheduledTime}>Đã lên lịch: {item.scheduled}</Text>
              </View>
            </Card>
          </View>
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
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { color: theme.colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },

  timelineContainer: { paddingLeft: 12 },
  timelineItem: { flexDirection: 'row', position: 'relative', marginBottom: theme.spacing.md },
  line: { position: 'absolute', top: 30, bottom: -20, left: 11, width: 2, backgroundColor: '#E2E8F0', zIndex: -1 },
  statusDot: { width: 32, alignItems: 'center', paddingTop: 16, marginRight: 12, backgroundColor: theme.colors.background },
  timelineCard: { flex: 1, marginBottom: 0 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain },
  itemDate: { fontSize: 12, color: theme.colors.textLight },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actualTime: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  scheduledTime: { fontSize: 12, color: theme.colors.textMuted }
});
