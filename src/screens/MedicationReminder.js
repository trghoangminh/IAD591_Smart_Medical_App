import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../components/Button';
import { Pill, Check, Clock, X } from 'lucide-react-native';
import { theme } from '../styles/theme';

export const MedicationReminder = ({ medication, onClose, onConfirm }) => {
  if (!medication) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <X size={32} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <View style={styles.iconCircle}>
          <Pill size={48} color="#FFF" />
        </View>
        
        <Text style={styles.subtitle}>Time to take ({medication.time})</Text>
        <Text style={styles.title}>{medication.name}</Text>
        <Text style={styles.instruction}>{medication.instruction}</Text>
      </View>

      <View style={styles.actionContainer}>
        <Button 
          variant="secondary" 
          style={styles.confirmBtn}
          onPress={onConfirm}
          icon={<Check size={24} color={theme.colors.primary} />}
        >
          Đã uống
        </Button>
        <Button 
          variant="primary" 
          style={styles.remindBtn}
          onPress={onClose}
          icon={<Clock size={20} color="#FFF" />}
        >
          Nhắc lại sau
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.primary,
    zIndex: 200,
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600'
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  instruction: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '500',
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  actionContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  confirmBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
  },
  remindBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  }
});
