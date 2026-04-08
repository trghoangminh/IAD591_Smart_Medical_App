import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Button } from '../components/Button';
import { Pill, Check, Clock, X } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { Medication } from '../types';

interface MedicationReminderProps {
  medication: Medication | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const MedicationReminder: React.FC<MedicationReminderProps> = ({
  medication,
  onClose,
  onConfirm,
}) => {
  if (!medication) return null;

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={!!medication}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Đóng"
              accessibilityRole="button"
            >
              <X size={32} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.centerContent}>
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircle}>
                  <Pill size={48} color={theme.colors.primary} />
                </View>
              </View>

              <Text style={styles.subtitle}>Đến giờ uống ({medication.time})</Text>
              <Text style={styles.title}>{medication.name}</Text>
              <Text style={styles.instruction}>{medication.instruction}</Text>
            </View>

            <View style={styles.actionContainer}>
              <Button
                variant="secondary"
                style={styles.confirmBtn}
                onPress={onConfirm}
                icon={<Check size={24} color={theme.colors.primary} />}
                accessibilityLabel="Xác nhận đã uống thuốc"
              >
                Đã uống
              </Button>
              <Button
                variant="primary"
                style={styles.remindBtn}
                onPress={onClose}
                icon={<Clock size={20} color="#FFF" />}
                accessibilityLabel="Nhắc lại sau"
              >
                Nhắc lại sau
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 64,
    marginBottom: theme.spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
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
    marginBottom: Platform.OS === 'ios' ? 20 : theme.spacing.xl,
  },
  confirmBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: theme.radius.lg,
  },
  remindBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: theme.radius.lg,
  },
});
