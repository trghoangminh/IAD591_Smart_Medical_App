import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User as UserIcon, Phone, LogOut, Bell, Moon, Clock, ChevronRight } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { User, getUserAPI } from '../services/api';
import { TabId } from '../types';

interface ProfileProps {
  onLogout: () => void;
  user: User;
  onNavigate?: (tab: TabId) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, user, onNavigate }) => {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [caretaker, setCaretaker] = useState<User | null>(null);

  useEffect(() => {
    if (user.caretaker_id) {
      getUserAPI(user.caretaker_id)
        .then(setCaretaker)
        .catch(console.warn);
    }
  }, [user.caretaker_id]);

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

      {user.role === 'patient' && (
        <>
          <Text style={styles.sectionTitle}>Hoạt động</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('history')}>
            <Card style={styles.navCard}>
              <View style={styles.navIcon}>
                <Clock size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.navInfo}>
                <Text style={styles.navTitle}>Lịch sử uống thuốc</Text>
                <Text style={styles.navSub}>Xem lịch sử đã uống / bỏ lỡ</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.textLight} />
            </Card>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.sectionTitle}>Liên hệ y tế</Text>
      
      {caretaker ? (
        <Card style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactRole}>{caretaker.role === 'doctor' ? 'Bác sĩ chính' : 'Người chăm sóc'}</Text>
            <Text style={styles.contactName}>{caretaker.name}</Text>
            <Text style={styles.contactPhone}>{caretaker.phone}</Text>
          </View>
          <View style={styles.callIcon}>
            <Phone size={20} color={theme.colors.success} />
          </View>
        </Card>
      ) : (
        <Card style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactRole}>Trống</Text>
            <Text style={styles.contactName}>Chưa thiết lập liên hệ y tế</Text>
            <Text style={styles.contactPhone}>Vui lòng cập nhật trên hệ thống</Text>
          </View>
        </Card>
      )}

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
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.sm + 4,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navInfo: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textMain },
  navSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xl,
  },
});
