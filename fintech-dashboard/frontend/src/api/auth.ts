import client from './client';
import { User } from '../types';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string, fullName: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/register', { email, password, fullName });
  return data;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}
