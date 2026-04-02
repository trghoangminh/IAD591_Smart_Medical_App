import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';
import { Lock, Mail, HeartPulse } from 'lucide-react-native';

export const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <HeartPulse size={48} color={theme.colors.primary} />
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng</Text>
            <Text style={styles.subtitle}>Đăng nhập để quản lý lịch uống thuốc của bạn hiệu quả hơn</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail color={theme.colors.textLight} size={20} style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Email hoặc Số điện thoại"
                placeholderTextColor={theme.colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color={theme.colors.textLight} size={20} style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={theme.colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <Button variant="primary" style={styles.loginBtn} onPress={onLogin}>
              Đăng nhập
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: theme.spacing.xl,
    paddingVertical: 40,
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMain,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: theme.spacing.md,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: theme.spacing.sm,
  }
});
