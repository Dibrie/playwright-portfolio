import client from './client';
import { User } from '../types';

export async function getProfile(): Promise<User> {
  const { data } = await client.get<User>('/profile');
  return data;
}

export async function updateProfile(fullName: string): Promise<User> {
  const { data } = await client.put<User>('/profile', { fullName });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  await client.put('/profile/password', { currentPassword, newPassword, confirmPassword });
}

export async function deleteAccount(): Promise<void> {
  await client.delete('/profile');
}
