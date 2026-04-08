import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { theme } from '../styles/theme';

interface TopBarProps {
  userName: string;
  hasNotification: boolean;
  onNotificationClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ userName, hasNotification, onNotificationClick }) => {
  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi sáng';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Chào buổi chiều';
  } else if (currentHour >= 18) {
    greeting = 'Chào buổi tối';
  }

  return (
    <View style={styles.topBar}>
      <View style={styles.profileArea}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingSm}>{greeting},</Text>
          <Text style={styles.greetingLg}>{userName}!</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onNotificationClick}
        accessibilityLabel="Thông báo"
        accessibilityRole="button"
      >
        <Bell size={20} color={theme.colors.textMain} />
        {hasNotification && <View style={styles.badge} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 90,
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  greeting: {},
  greetingSm: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
  },
  greetingLg: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textMain,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: theme.colors.danger,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
});
