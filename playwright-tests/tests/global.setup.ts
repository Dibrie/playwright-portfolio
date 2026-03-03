import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE, TEST_USER } from './helpers/constants';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  await page.getByTestId('submit-button').click();
  await page.waitForURL('/dashboard');
  await expect(page.getByTestId('card-balance')).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});