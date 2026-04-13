import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Bell } from 'lucide-react-native';
import { theme } from '../styles/theme';

interface Props {
  title: string;
  body: string;
  visible: boolean;
  onClose: () => void;
}

export const InAppNotificationBanner: React.FC<Props> = ({ title, body, visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 40, 
        friction: 5,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        closeBanner();
      }, 5000); // Tự động đóng sau 5 giây
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const closeBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={closeBanner} style={styles.card}>
        <View style={styles.iconBox}>
          <Bell color="#FFF" size={24} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999, // Ép nổi lên trên cùng
    elevation: 999,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textItem,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  }
});
