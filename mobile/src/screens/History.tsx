import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { TimelineItem } from '../types';
import { User, getHistoryAPI } from '../services/api';

interface HistoryProps {
  user: User;
  onBack?: () => void;
}

interface ProcessedTimelineItem extends TimelineItem {
  timestampDate: Date;
}

export const History: React.FC<HistoryProps> = ({ user, onBack }) => {
  const [filter, setFilter] = useState<string>('Hôm nay');
  const [data, setData] = useState<ProcessedTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const result = await getHistoryAPI(user.id);

        const formatDateLabel = (isoStr: string) => {
          const date = new Date(isoStr);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const isSameDay = (d1: Date, d2: Date) => 
            d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
          
          if (isSameDay(date, today)) return 'Hôm nay';
          if (isSameDay(date, yesterday)) return 'Hôm qua';
          return date.toLocaleDateString('vi-VN');
        };

        const formatTime = (isoStr: string) => {
          const d = new Date(isoStr);
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        const mapped: ProcessedTimelineItem[] = result.map((r) => ({
          id: r.log_id,
          name: r.medicine,
          status: r.status,
          scheduled: r.scheduled_time,
          time: formatTime(r.timestamp),
          date: formatDateLabel(r.timestamp),
          timestampDate: new Date(r.timestamp),
        }));
        
        setData(mapped);
      } catch (err) {
        console.warn('Lỗi tải lịch sử:', err);
      } finally {
        setTimeout(() => setLoading(false), 100);
      }
    };
    loadHistory();
  }, [user]);

  const filteredTimeline = data.filter((item) => {
    if (filter === 'Hôm nay') return item.date === 'Hôm nay';
    const diffDays = (new Date().getTime() - item.timestampDate.getTime()) / (1000 * 3600 * 24);
    if (filter === '7 Ngày') return diffDays <= 7;
    return diffDays <= 30; // 30 Ngày
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={theme.colors.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử</Text>
        <Text style={styles.subtitle}>Theo dõi lịch sử uống thuốc</Text>
      </View>

      <View style={styles.filterRow}>
        {['Hôm nay', '7 Ngày', '30 Ngày'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : filteredTimeline.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
          <Text style={{ fontSize: 16, color: theme.colors.textMuted }}>Không có ghi nhận nào</Text>
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {filteredTimeline.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              {index !== filteredTimeline.length - 1 && <View style={styles.line} />}

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
                  <Text style={[styles.actualTime, item.status === 'missed' && { color: theme.colors.danger }]}>
                    {item.status === 'taken' ? `Đã uống: ${item.time}` : 'Bỏ lỡ'}
                  </Text>
                  <Text style={styles.scheduledTime}>Đã lên lịch: {item.scheduled}</Text>
                </View>
              </Card>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  backText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600', marginLeft: 2 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { color: theme.colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  timelineContainer: { paddingLeft: 12 },
  timelineItem: { flexDirection: 'row', position: 'relative', marginBottom: theme.spacing.md },
  line: {
    position: 'absolute',
    top: 30,
    bottom: -20,
    left: 11,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: -1,
  },
  statusDot: {
    width: 32,
    alignItems: 'center',
    paddingTop: 16,
    marginRight: 12,
    backgroundColor: theme.colors.background,
  },
  timelineCard: { flex: 1, marginBottom: 0 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain },
  itemDate: { fontSize: 12, color: theme.colors.textLight },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actualTime: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  scheduledTime: { fontSize: 12, color: theme.colors.textMuted },
});
