import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../styles/theme';

export const Analytics = () => {
  const [filter, setFilter] = useState('Week'); // Week | Month

  const weeklyData = [
    { day: 'Mon', percentage: 100 },
    { day: 'Tue', percentage: 66 },
    { day: 'Wed', percentage: 100 },
    { day: 'Thu', percentage: 0 },   // Highly missed day
    { day: 'Fri', percentage: 33 },
    { day: 'Sat', percentage: 100 },
    { day: 'Sun', percentage: 80 },
  ];

  // Dummy stats
  const totalDoses = 21;
  const takenDoses = 16;
  const missedDoses = 5;
  const takenPercent = Math.round((takenDoses / totalDoses) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Report & Analytics</Text>
        <Text style={styles.subtitle}>Track your medication adherence</Text>
      </View>

      <View style={styles.filterRow}>
        {['Week', 'Month'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Stats & "Pie Chart" alternative (Segmented bar for React Native) */}
      <Text style={styles.sectionTitle}>Adherence Overview</Text>
      <Card>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{takenPercent}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statBig, { color: theme.colors.success }]}>{takenDoses}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statBig, { color: theme.colors.danger }]}>{missedDoses}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>

        {/* Segmented Bar simulating Pie Distribution */}
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, { flex: takenDoses, backgroundColor: theme.colors.success }]} />
          <View style={[styles.segment, { flex: missedDoses, backgroundColor: theme.colors.danger }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 12, color: theme.colors.success, fontWeight: 'bold' }}>Taken (76%)</Text>
          <Text style={{ fontSize: 12, color: theme.colors.danger, fontWeight: 'bold' }}>Missed (24%)</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Daily Breakdown (Bar Chart)</Text>
      <Card>
        <View style={styles.chartContainer}>
          {weeklyData.map((d, i) => {
            const isCritical = d.percentage === 0;
            return (
              <View key={i} style={styles.barColumn}>
                <View style={[styles.barTrack, isCritical && { borderColor: theme.colors.danger, borderWidth: 1 }]}>
                  <View style={[styles.barFill, { 
                      height: `${d.percentage}%`,
                      backgroundColor: d.percentage === 100 ? theme.colors.primary : d.percentage > 50 ? theme.colors.warning : theme.colors.danger
                    }]} 
                  />
                  {/* Highlight missed days heavily */}
                  {isCritical && <Text style={{ position: 'absolute', top: -16, color: theme.colors.danger, fontSize: 10, fontWeight: 'bold' }}>!!</Text>}
                </View>
                <Text style={[styles.dayLabel, isCritical && { color: theme.colors.danger, fontWeight: 'bold' }]}>{d.day}</Text>
              </View>
            )
          })}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  filterChip: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { color: theme.colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 12, marginTop: 8 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { alignItems: 'center', flex: 1 },
  statBig: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textMain },
  statLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },

  segmentedBar: { height: 16, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  segment: { height: '100%' },

  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: 20 },
  barColumn: { alignItems: 'center', height: '100%', flex: 1 },
  barTrack: { flex: 1, width: 24, backgroundColor: theme.colors.background, borderRadius: 12, justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  barFill: { width: '100%', borderRadius: 12, alignSelf: 'flex-end' },
  dayLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 8 }
});
