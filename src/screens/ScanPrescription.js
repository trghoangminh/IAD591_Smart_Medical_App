import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Camera, CheckCircle2, RefreshCcw } from 'lucide-react-native';
import { theme } from '../styles/theme';

export const ScanPrescription = () => {
  const [step, setStep] = useState('camera'); // 'camera' | 'preview' | 'form'

  const handleCapture = () => setStep('preview');
  const handleApprove = () => setStep('form');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Thêm thuốc</Text>
        <Text style={styles.subtitle}>Quét nhãn thuốc hoặc đơn thuốc</Text>
      </View>

      {step === 'camera' && (
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {/* Viewfinder brackets */}
            <View style={[styles.bracket, styles.tr]} />
            <View style={[styles.bracket, styles.tl]} />
            <View style={[styles.bracket, styles.br]} />
            <View style={[styles.bracket, styles.bl]} />
            <Text style={styles.viewfinderText}>Căn chỉnh nhãn trong khung</Text>
          </View>
          
          <Button 
            variant="primary" 
            onPress={handleCapture} 
            icon={<Camera size={20} color="#fff" />}
            style={{ marginTop: theme.spacing.lg }}
          >
            Chụp ảnh
          </Button>
        </View>
      )}

      {step === 'preview' && (
        <View style={styles.viewfinderContainer}>
          <View style={[styles.viewfinder, { backgroundColor: '#E2E8F0', padding: 20 }]}>
             <View style={{ width: '100%', height: '100%', backgroundColor: '#CBD5E1', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
               <Text style={{ color: theme.colors.textMuted }}>[ Xem trước ảnh đã chụp ]</Text>
             </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: 12 }}>
            <Button variant="secondary" onPress={() => setStep('camera')} icon={<RefreshCcw size={20} color={theme.colors.primary} />} style={{ flex: 1 }}>Chụp lại</Button>
            <Button variant="primary" onPress={handleApprove} icon={<CheckCircle2 size={20} color="#FFF" />} style={{ flex: 1 }}>Xử lý OCR</Button>
          </View>
        </View>
      )}

      {step === 'form' && (
        <View style={styles.formContainer}>
          <Card>
            <View style={styles.successHeader}>
              <CheckCircle2 size={24} color={theme.colors.success} />
              <Text style={styles.successText}>Quét thành công</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên thuốc</Text>
              <TextInput style={styles.input} defaultValue="Amlodipine" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Liều lượng</Text>
              <TextInput style={styles.input} defaultValue="5mg" />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tần suất</Text>
              <TextInput style={styles.input} defaultValue="1 Viên mỗi ngày" />
            </View>
          </Card>
          
          <View style={styles.actionRow}>
            <Button variant="secondary" onPress={() => setStep('camera')} style={{ flex: 1, marginRight: 8 }}>Hủy</Button>
            <Button variant="primary" style={{ flex: 2 }}>Thêm vào lịch</Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100, flexGrow: 1 },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textMain },
  subtitle: { color: theme.colors.textLight, marginTop: 4 },
  
  viewfinderContainer: { flex: 1 },
  viewfinder: {
    height: 400,
    backgroundColor: '#000',
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bracket: { position: 'absolute', width: 40, height: 40, borderColor: '#fff' },
  tl: { top: 40, left: 40, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 40, right: 40, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 40, left: 40, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 40, right: 40, borderBottomWidth: 4, borderRightWidth: 4 },
  viewfinderText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  
  formContainer: { flex: 1 },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  successText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: theme.radius.sm,
    padding: 12, fontSize: 16, color: theme.colors.textMain
  },
  actionRow: { flexDirection: 'row', marginTop: theme.spacing.sm }
});
