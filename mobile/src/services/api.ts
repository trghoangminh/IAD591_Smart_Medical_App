import { Platform } from 'react-native';

export interface User {
  id: number;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  caretaker_id?: number | null;
}

// Môi trường mặc định nếu chưa cấu hình file .env
const DEFAULT_API_URL = Platform.OS === 'web' 
  ? (process.env.EXPO_PUBLIC_WEB_API_URL ?? 'http://localhost:8000')
  : (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.191:8000');

export const apiBaseUrl = DEFAULT_API_URL;

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
  const response = await fetch(`${apiBaseUrl}/api/schedule/${userId}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
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

export interface HistoryResponse {
  log_id: number;
  medicine: string;
  scheduled_time: string;
  status: 'taken' | 'missed';
  timestamp: string;
}

export const getHistoryAPI = async (userId: number): Promise<HistoryResponse[]> => {
  const response = await fetch(`${apiBaseUrl}/api/history/${userId}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi tải dữ liệu lịch sử!');
  }
  return await response.json() as HistoryResponse[];
};

export interface NotificationResponse {
  id: number;
  message: string;
  is_read: number;
  timestamp: string;
}

export interface BasicAnalytics {
  user_id: number;
  total_schedules: number;
  taken: number;
  missed: number;
  adherence_rate: number;
}

export const getBasicAnalyticsAPI = async (userId: number): Promise<BasicAnalytics> => {
  const response = await fetch(`${apiBaseUrl}/api/analytics/${userId}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi tải dữ liệu báo cáo!');
  }
  return await response.json() as BasicAnalytics;
};

export const getNotificationsAPI = async (userId: number): Promise<NotificationResponse[]> => {
  const response = await fetch(`${apiBaseUrl}/api/notifications/${userId}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi tải thông báo!');
  }
  return await response.json() as NotificationResponse[];
};

export const getUserAPI = async (userId: number): Promise<User> => {
  const response = await fetch(`${apiBaseUrl}/api/users/${userId}?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi tải thông tin user!');
  }
  return await response.json() as User;
};

export interface PatientPrescription {
  id: number;
  medicine: string;
  dosage: number;
  times: string[];
}

export interface PatientResponse {
  id: number;
  name: string;
  phone: string;
  email: string;
  adherence_rate: number;
  prescriptions_count: number;
  prescriptions: PatientPrescription[];
}

export const getDoctorPatientsAPI = async (doctorId: number): Promise<PatientResponse[]> => {
  const response = await fetch(`${apiBaseUrl}/api/doctor/${doctorId}/patients?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi tải danh sách bệnh nhân!');
  }
  return await response.json() as PatientResponse[];
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

export interface PrescriptionCreate {
  user_id: number;
  medicine: string;
  dosage: number;
  times: string[];
  start_date?: string;
  end_date?: string;
}

export const createPrescriptionAPI = async (data: PrescriptionCreate): Promise<any> => {
  const response = await fetch(`${apiBaseUrl}/api/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Lỗi thêm đơn thuốc!');
  }
  
  return await response.json();
};
