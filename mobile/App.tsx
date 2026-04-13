import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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
import { Medication, TabId } from './src/types';
import { User } from './src/services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeMedication, setActiveMedication] = useState<Medication | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  const [toastMessage, setToastMessage] = useState<string>('');

  const handleLogout = () => {
    setToastMessage('Bạn đã đăng xuất thành công!');
    setTimeout(() => {
      setToastMessage('');
      setCurrentUser(null);
    }, 1500);
  };

  const renderScreen = (): React.ReactNode => {
    if (showNotifications) return <Notifications />;

    switch (activeTab) {
      case 'home':
        return <HomeDashboard onTakeMed={(med) => setActiveMedication(med)} />;
      case 'analytics':
        return <Analytics />;
      case 'scan':
        return <ScanPrescription />;
      case 'history':
        return <History />;
      case 'profile':
        return <Profile onLogout={handleLogout} user={currentUser} />;
      default:
        return <HomeDashboard onTakeMed={(med) => setActiveMedication(med)} />;
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
      />

      {activeMedication && (
        <MedicationReminder
          medication={activeMedication}
          onClose={() => setActiveMedication(null)}
          onConfirm={() => setActiveMedication(null)}
        />
      )}

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
