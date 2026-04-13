// Gỡ bỏ hoàn toàn expo-notifications để tránh lỗi cấu hình Native của Expo Go Android

export const requestNotificationPermissions = async () => {
  return true;
};

export const scheduleReminderNotification = async (title: string, body: string, delaySeconds: number) => {
  // Logic chuyển sang In-App Banner
};

export const syncMedicationAlarms = async (medications: any[]) => {
  // Logic chuyển sang In-App Background Sync Timer
};
