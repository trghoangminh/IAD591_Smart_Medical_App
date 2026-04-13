import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User as UserIcon, Phone, LogOut, Bell, Moon } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { User } from '../services/api';

interface ProfileProps {
  onLogout: () => void;
  user: User;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, user }) => {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Cá nhân & Cài đặt</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <UserIcon size={36} color={theme.colors.primary} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email || user.phone || 'Chưa có thông tin LL'}</Text>
        <Text style={{color: theme.colors.textMuted, fontSize: 13, marginTop: 4}}>
          Vai trò: {user.role === 'patient' ? 'Bệnh nhân' : (user.role === 'doctor' ? 'Bác sĩ' : 'Người nhà')}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Liên hệ y tế</Text>
      <Card style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactRole}>Bác sĩ chính</Text>
          <Text style={styles.contactName}>Dr. Gregory House</Text>
          <Text style={styles.contactPhone}>+1 (555) 019-8372</Text>
        </View>
        <View style={styles.callIcon}>
          <Phone size={20} color={theme.colors.success} />
        </View>
      </Card>

      <Card style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactRole}>Người chăm sóc</Text>
          <Text style={styles.contactName}>Chidi Anagonye</Text>
          <Text style={styles.contactPhone}>+1 (555) 124-5555</Text>
        </View>
        <View style={styles.callIcon}>
          <Phone size={20} color={theme.colors.success} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Cài đặt</Text>
      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Bell size={20} color={theme.colors.textMain} />
            <Text style={styles.settingText}>Thông báo đẩy</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#E2E8F0', true: theme.colors.primaryLight }}
            thumbColor={notifications ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Moon size={20} color={theme.colors.textMain} />
            <Text style={styles.settingText}>Chế độ tối</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#E2E8F0', true: theme.colors.primaryLight }}
            thumbColor={darkMode ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
      </Card>

      <Button
        variant="danger"
        icon={<LogOut size={20} color="#FFF" />}
        style={{ marginTop: theme.spacing.md }}
        onPress={onLogout}
      >
        Đăng xuất
      </Button>
      <Text style={styles.version}>Phiên bản ứng dụng 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  profileCard: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  userEmail: { fontSize: 14, color: theme.colors.textMuted },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactInfo: { flex: 1 },
  contactRole: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  contactName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textMain, marginBottom: 4 },
  contactPhone: { fontSize: 14, color: theme.colors.textMuted },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCard: { padding: 0, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  settingLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 16, color: theme.colors.textMain, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F6F9', marginHorizontal: theme.spacing.md },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xl,
  },
});
