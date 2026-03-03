import path from 'path';

export const STORAGE_STATE = path.join(__dirname, '../../.auth/user.json');

export const TEST_USER = {
  email: 'demo@fintrack.io',
  password: 'password123',
  fullName: 'Alex Morgan',
};

export const API_BASE = 'http://localhost:3001/api';