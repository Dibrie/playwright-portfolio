import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const STORAGE_STATE = path.join(__dirname, '../.auth/user.json');

export const TEST_USER = {
  email: 'demo@fintrack.io',
  password: 'password123',
  fullName: 'Alex Morgan',
};

export const API_BASE = 'http://localhost:3001/api';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  await page.getByTestId('submit-button').click();
  await page.waitForURL('/dashboard');
  await expect(page.getByTestId('card-balance')).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});