import { test, expect } from '../fixtures';
import { API_BASE } from '../helpers/constants';
import { ProfilePage } from '../pages/ProfilePage';

test.describe('Profile', () => {

  test.describe('Profile information', () => {
    test('should display current display name', async ({ profilePage }) => {
      await profilePage.goto();
      await expect(profilePage.displayNameInput).toBeVisible();
      const name = await profilePage.displayNameInput.inputValue();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should display email as read only', async ({ profilePage }) => {
      await profilePage.goto();
      expect(await profilePage.isEmailReadOnly()).toBe(true);
    });

    test('should update display name successfully', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.updateDisplayName('Updated Name');
      // Name should persist after page reload
      await profilePage.goto();
      const name = await profilePage.displayNameInput.inputValue();
      expect(name).toBe('Updated Name');
    });
  });

  test.describe('Change password', () => {
    test('should show password fields', async ({ profilePage }) => {
      await profilePage.goto();
      await expect(profilePage.currentPasswordInput).toBeVisible();
      await expect(profilePage.newPasswordInput).toBeVisible();
      await expect(profilePage.confirmPasswordInput).toBeVisible();
    });

    test('should fail with wrong current password', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.changePassword('wrongpassword', 'newpassword123');
      // Should stay on profile page — no redirect
      await expect(profilePage.page).toHaveURL('/profile');
    });
  });

  test.describe('Danger zone - authenticated', () => {
    test('should show confirmation modal on delete click', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.deleteAccountButton.click();
      await expect(profilePage.confirmDeleteButton).toBeVisible();
    });

    test('should cancel delete and stay on profile', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.cancelDelete();
      await expect(profilePage.page).toHaveURL('/profile');
    });
  });

  test.describe('Danger zone - delete account', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should delete account and redirect to login', async ({ page, apiContext }) => {
      const email = `delete+${Date.now()}@fintrack.io`;
      const registerResponse = await apiContext.post(`${API_BASE}/auth/register`, {
        data: { email, password: 'password123', fullName: 'Delete Me' }
      });
      expect(registerResponse.ok()).toBeTruthy();

      await page.goto('http://localhost:5173/login');
      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('submit-button').click();
      await page.waitForURL('**/dashboard');

      await page.goto('http://localhost:5173/profile');
      await page.getByTestId('delete-account-btn').click();
      await page.getByTestId('confirm-delete').click();
      await expect(page).toHaveURL('http://localhost:5173/login');
    });
  });

});