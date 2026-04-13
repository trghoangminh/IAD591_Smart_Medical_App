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
