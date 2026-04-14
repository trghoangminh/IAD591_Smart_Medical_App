import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Platform } from 'react-native';
import { TopBar } from './src/components/TopBar';
import { BottomNav } from './src/components/BottomNav';
import { HomeDashboard } from './src/screens/HomeDashboard';
import { ScanPrescription } from './src/screens/ScanPrescription';
import { Analytics } from './src/screens/Analytics';
import { History } from './src/screens/History';
import { Profile } from './src/screens/Profile';
import { Notifications } from './src/screens/Notifications';
import { MedicationReminder } from './src/screens/MedicationReminder';
import { LoginScreen } from './src/screens/LoginScreen';
import { DoctorDashboard } from './src/screens/DoctorDashboard';
import { DoctorPatientReport } from './src/screens/DoctorPatientReport';
import { Medication, TabId } from './src/types';
import { User, confirmMedicationAPI } from './src/services/api';
import { InAppNotificationBanner } from './src/components/InAppNotificationBanner';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeMedication, setActiveMedication] = useState<Medication | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [doctorViewingPatient, setDoctorViewingPatient] = useState<{id: number, name: string} | null>(null);

  const [toastMessage, setToastMessage] = useState<string>('');

  const [inAppNotice, setInAppNotice] = useState<{ title: string, body: string } | null>(null);

  useEffect(() => {
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setToastMessage(`Đăng nhập thành công! Chào ${user.name}`);
    setTimeout(() => setToastMessage(''), 1500);
  };

  const handleLogout = () => {
    setToastMessage('Bạn đã đăng xuất thành công!');
    setTimeout(() => {
      setToastMessage('');
      setCurrentUser(null);
    }, 1500);
  };

  const handleConfirmMedication = async () => {
    if (!currentUser || !activeMedication) return;
    try {
      await confirmMedicationAPI(currentUser.id, activeMedication.name, activeMedication.time);
      setToastMessage('Ghi nhận đã uống thuốc thành công!');
      setTimeout(() => setToastMessage(''), 1500);
      setRefreshKey((prev) => prev + 1); // Trigger React hook to reload Dashboard
    } catch (error: any) {
      setToastMessage(error.message || 'Lỗi hệ thống khi xác nhận');
      setTimeout(() => setToastMessage(''), 1500);
    } finally {
      setActiveMedication(null);
    }
  };

  const handleRemindLater = async () => {
    if (!activeMedication) return;
    const medToRemind = activeMedication;
    setActiveMedication(null);
    
    setToastMessage('Sẽ báo thức lại qua Banner chờ 10 giây nữa!');
    setTimeout(() => setToastMessage(''), 2500);

    // Kích hoạt Mock JS Banner: Tự thả một banner giả lập rớt xuống màn hình
    setTimeout(() => {
      setInAppNotice({
        title: '⌛ Bạn có lịch uống thuốc đang trống!',
        body: `Đã qua giờ cho thuốc ${medToRemind.name}. Nhấn vào để xác nhận đã uống!`,
      });
    }, 10000);
  };

  if (!currentUser) {
    return (
      <View style={{ flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : 'auto' }}>
        <LoginScreen onLogin={handleLogin} />
        {!!toastMessage && (
          <Modal transparent={true} visible={!!toastMessage} animationType="fade">
            <View style={styles.toastOverlay}>
              <View style={styles.toastContainer}>
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  const renderScreen = (): React.ReactNode => {
    if (showNotifications) return <Notifications user={currentUser} />;

    switch (activeTab) {
      case 'home':
        if (currentUser.role === 'doctor') {
          return (
            <DoctorDashboard 
              user={currentUser} 
              onViewAnalytics={(id, name) => { 
                setDoctorViewingPatient({id, name}); 
                setActiveTab('doctor-report'); 
              }} 
            />
          );
        }
        return (
          <HomeDashboard 
            user={currentUser} 
            refreshKey={refreshKey} 
            onTakeMed={(med) => setActiveMedication(med)} 
            onScheduleHit={(title, body) => setInAppNotice({ title, body })}
          />
        );
      case 'doctor-report':
        if (currentUser.role === 'doctor' && doctorViewingPatient) {
          return (
            <DoctorPatientReport 
              patientId={doctorViewingPatient.id} 
              patientName={doctorViewingPatient.name} 
              onBack={() => { 
                setDoctorViewingPatient(null); 
                setActiveTab('home'); 
              }} 
            />
          );
        }
        return <DoctorDashboard user={currentUser} />;
      case 'analytics':
        return <Analytics />;
      case 'scan':
        return (
          <ScanPrescription 
            user={currentUser} 
            onAdded={() => { 
                setRefreshKey(prev => prev + 1); 
                setActiveTab('home'); 
                setToastMessage('Thêm đơn thuốc thành công!'); 
                setTimeout(() => setToastMessage(''), 1500);
            }} 
            onCancel={() => setActiveTab('home')}
          />
        );
      case 'history':
        return <History user={currentUser} />;
      case 'profile':
        return <Profile onLogout={handleLogout} user={currentUser} />;
      default:
        return (
          <HomeDashboard 
            user={currentUser} 
            refreshKey={refreshKey} 
            onTakeMed={(med) => setActiveMedication(med)} 
            onScheduleHit={(title, body) => setInAppNotice({ title, body })}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TopBar
        userName={currentUser.name}
        hasNotification={true}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
      />

      <View style={styles.content}>{renderScreen()}</View>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setShowNotifications(false);
        }}
        userRole={currentUser.role}
      />

      {activeMedication && (
        <MedicationReminder
          medication={activeMedication}
          onClose={handleRemindLater}
          onConfirm={handleConfirmMedication}
        />
      )}

      <InAppNotificationBanner 
        title={inAppNotice?.title || ''}
        body={inAppNotice?.body || ''}
        visible={!!inAppNotice}
        onClose={() => setInAppNotice(null)}
      />

      {/* Global Logout Toast */}
      {!!toastMessage && (
        <Modal transparent={true} visible={!!toastMessage} animationType="fade">
          <View style={styles.toastOverlay}>
            <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : 'auto',
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  toastOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 120 : 80,
  },
  toastContainer: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  }
});
