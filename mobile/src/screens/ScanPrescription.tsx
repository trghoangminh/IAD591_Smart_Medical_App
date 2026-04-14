import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Camera, CheckCircle2, RefreshCcw } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { createPrescriptionAPI, User, getDoctorPatientsAPI, PatientResponse } from '../services/api';

type ScanStep = 'camera' | 'preview' | 'form';

interface ScanPrescriptionProps {
  user?: User;
  onAdded?: () => void;
  onCancel?: () => void;
}

export const ScanPrescription: React.FC<ScanPrescriptionProps> = ({ user, onAdded, onCancel }) => {
  const [step, setStep] = useState<ScanStep>('camera');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [medicine, setMedicine] = useState('Amlodipine');
  const [dosage, setDosage] = useState('5');
  const [times, setTimes] = useState('08:00, 20:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [targetPatientId, setTargetPatientId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'doctor') {
      getDoctorPatientsAPI(user.id)
        .then(data => setPatients(data))
        .catch(err => console.warn(err));
    } else {
      setTargetPatientId(user?.id || null);
    }
  }, [user]);

  const handleCapture = async (): Promise<void> => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setStep('preview');
      }
    }
  };

  const handleApprove = (): void => {
    setIsManual(false);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (user.role === 'doctor' && !targetPatientId) {
      alert('Vui lòng chọn bệnh nhân để kê đơn!');
      return;
    }

    setLoading(true);
    try {
      const timesList = times.split(',').map((t) => t.trim()).filter(Boolean);
      await createPrescriptionAPI({
        user_id: targetPatientId as number,
        medicine,
        dosage: parseInt(dosage) || 1,
        times: timesList.length ? timesList : ['08:00'],
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      onAdded?.();
    } catch (err) {
      console.warn('Lỗi thêm thuốc', err);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', padding: theme.spacing.xl }]}>
        <Text
          style={{
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
            fontSize: 16,
            color: theme.colors.textMain,
          }}
        >
          Ứng dụng cần quyền truy cập camera để chụp ảnh đơn thuốc.
        </Text>
        <Button variant="primary" onPress={requestPermission}>
          Cấp quyền Camera
        </Button>
        <Button variant="secondary" onPress={() => { setIsManual(true); setStep('form'); }} style={{ marginTop: 12 }}>
          Hoặc nhập thủ công
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Thêm thuốc</Text>
        <Text style={styles.subtitle}>Quét nhãn thuốc hoặc nhập thông tin</Text>
      </View>

      {step === 'camera' && (
        <View style={styles.viewfinderContainer}>
          <View style={{ borderRadius: theme.radius.lg, overflow: 'hidden' }}>
            <CameraView
              style={styles.viewfinder}
              facing="back"
              ref={cameraRef}
            >
              <View style={[styles.bracket, styles.tr]} />
              <View style={[styles.bracket, styles.tl]} />
              <View style={[styles.bracket, styles.br]} />
              <View style={[styles.bracket, styles.bl]} />
              <Text style={styles.viewfinderText}>Căn chỉnh mã trong khung</Text>
            </CameraView>
          </View>

          <Button
            variant="secondary"
            onPress={handleCapture}
            icon={<Camera size={20} color={theme.colors.primary} />}
            style={{ marginTop: theme.spacing.lg }}
          >
            Chụp thủ công
          </Button>

          <Button
            variant="secondary"
            onPress={() => { setIsManual(true); setStep('form'); }}
            style={{ marginTop: 12, borderColor: 'transparent', backgroundColor: '#F1F5F9' }}
          >
            Nhập tay thủ công
          </Button>
        </View>
      )}

      {step === 'preview' && (
        <View style={styles.viewfinderContainer}>
          <View style={[styles.viewfinder, { overflow: 'hidden' }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: '#CBD5E1' }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: 12 }}>
            <Button
              variant="secondary"
              onPress={() => setStep('camera')}
              icon={<RefreshCcw size={20} color={theme.colors.primary} />}
              style={{ flex: 1 }}
            >
              Chụp lại
            </Button>
            <Button
              variant="primary"
              onPress={handleApprove}
              icon={<CheckCircle2 size={20} color="#FFF" />}
              style={{ flex: 1 }}
            >
              Xử lý OCR
            </Button>
          </View>
        </View>
      )}

      {step === 'form' && (
        <View style={styles.formContainer}>
          {user?.role === 'doctor' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Bác sĩ kê đơn cho Bệnh Nhân:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {patients.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.patientPill,
                      targetPatientId === p.id && styles.patientPillActive
                    ]}
                    onPress={() => setTargetPatientId(p.id)}
                  >
                    <Text style={[
                      styles.patientPillText,
                      targetPatientId === p.id && styles.patientPillTextActive
                    ]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {patients.length === 0 && (
                  <Text style={{color: theme.colors.textMuted, fontSize: 13, marginTop: 4}}>Chưa có bệnh nhân nào khả dụng.</Text>
                )}
              </ScrollView>
            </View>
          )}

          <Card>
            {!isManual ? (
              <View style={styles.successHeader}>
                <CheckCircle2 size={24} color={theme.colors.success} />
                <Text style={styles.successText}>Quét thành công (Mô phỏng)</Text>
              </View>
            ) : (
              <View style={styles.successHeader}>
                <Text style={styles.successText}>📝 Nhập thông tin</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên thuốc</Text>
              <TextInput style={styles.input} value={medicine} onChangeText={setMedicine} placeholder="Ví dụ: Paracetamol" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Liều lượng (viên/mg)</Text>
              <TextInput style={styles.input} value={dosage} onChangeText={setDosage} keyboardType="numeric" placeholder="Ví dụ: 1" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giờ uống (cách nhau bởi dấu phẩy)</Text>
              <TextInput style={styles.input} value={times} onChangeText={setTimes} placeholder="08:00, 20:00" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày bắt đầu (Tùy chọn, YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2024-01-01" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày kết thúc (Tùy chọn, YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2024-12-31" />
            </View>
          </Card>

          <View style={styles.actionRow}>
            <Button variant="secondary" onPress={() => onCancel?.()} style={{ flex: 1, marginRight: 8 }}>
              Hủy
            </Button>
            <Button variant="primary" onPress={handleSubmit} style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Thêm vào lịch'}
            </Button>
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
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  successText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.radius.sm,
    padding: 12,
    fontSize: 16,
    color: theme.colors.textMain,
  },
  actionRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  patientPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  patientPillText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  patientPillTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
