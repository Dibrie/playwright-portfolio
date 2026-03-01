import { useState, useCallback } from 'react';
import { User } from '../types';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const data = await apiRegister(email, password, fullName);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // best effort
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  return { user, login, register, logout, updateUser };
}
