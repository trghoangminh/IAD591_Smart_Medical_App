import { Platform } from 'react-native';

export interface User {
  id: number;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  caretaker_id?: number | null;
}

// Sử dụng IP mạng LAN của máy Mac để test qua đt thật thay vì localhost
const DEFAULT_API_URL = 'http://192.168.1.191:8000';

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const loginAPI = async (username: string, password: string): Promise<User> => {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Sai tài khoản hoặc mật khẩu');
  }
  
  const data = await response.json();
  return data.user as User;
};

export interface ScheduleResponse {
  schedule_id: number;
  medicine: string;
  dosage: number;
  time: string;
  status: 'pending' | 'taken' | 'missed';
}

export const getScheduleAPI = async (userId: number): Promise<ScheduleResponse[]> => {
  const response = await fetch(`${apiBaseUrl}/api/schedule/${userId}`);
  if (!response.ok) {
    throw new Error('Lỗi tải dữ liệu lịch uống thuốc!');
  }
  const data = await response.json();
  return data as ScheduleResponse[];
};

export const confirmMedicationAPI = async (userId: number, medicine: string, time: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/api/device/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, medicine, time })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Lỗi xác nhận uống thuốc!');
  }
};

export const checkMissedSchedulesAPI = async (): Promise<void> => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/cron/check-missed-schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      console.warn('Lỗi đồng bộ lịch trễ hẹn');
    }
  } catch (error) {
    console.warn('Không thể kết nối đến máy chủ để dọn dẹp lịch.');
  }
};
