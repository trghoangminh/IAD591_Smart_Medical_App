import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeMedication, setActiveMedication] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderScreen = () => {
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
        return <Profile />;
      default:
        return <HomeDashboard onTakeMed={(med) => setActiveMedication(med)} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TopBar 
        userName="Anh Tuấn" 
        hasNotification={true} 
        onNotificationClick={() => setShowNotifications(!showNotifications)} 
      />
      
      <View style={styles.content}>
        {renderScreen()}
      </View>

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
  }
});
