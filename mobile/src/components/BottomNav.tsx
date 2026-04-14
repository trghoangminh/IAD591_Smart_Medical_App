import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, ScanLine, BarChart2, Clock, User as UserIcon, Users, LucideIcon } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { TabId } from '../types';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userRole: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole }) => {
  const patientTabs: Tab[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'analytics', label: 'Báo cáo', icon: BarChart2 },
    { id: 'scan', label: 'Quét', icon: ScanLine },
    { id: 'history', label: 'Lịch sử', icon: Clock },
    { id: 'profile', label: 'Cá nhân', icon: UserIcon },
  ];

  const doctorTabs: Tab[] = [
    { id: 'home', label: 'Bệnh nhân', icon: Users },
    { id: 'scan', label: 'Kê đơn', icon: ScanLine },
    { id: 'profile', label: 'Cá nhân', icon: UserIcon },
  ];

  const tabs = userRole === 'doctor' ? doctorTabs : patientTabs;

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const color = isActive ? theme.colors.primary : theme.colors.textLight;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {tab.id === 'scan' ? (
              <View style={styles.scanBtn}>
                <Icon size={28} color="#FFF" strokeWidth={2.5} />
              </View>
            ) : (
              <Icon size={24} color={color} strokeWidth={isActive ? 2.5 : 2} />
            )}
            <Text
              style={[
                styles.navText,
                {
                  color: tab.id === 'scan' ? theme.colors.primary : color,
                  fontWeight: isActive ? 'bold' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ translateY: -10 }],
  },
});
