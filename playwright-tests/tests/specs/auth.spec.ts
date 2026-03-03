import { test, expect } from '../fixtures';
import { STORAGE_STATE, TEST_USER } from '../helpers/constants';

test.describe('Authentication', () => {

  test.describe('Login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('should login successfully with valid credentials', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.page.waitForURL('/dashboard');
      await expect(loginPage.page).toHaveURL('/dashboard');
    });

    test('should show error with invalid credentials', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('wrong@email.com', 'wrongpassword');
      await expect(loginPage.errorMessage).toBeVisible();
      const error = await loginPage.getErrorMessage();
      expect(error?.trim()).toBe('Invalid email or password');
    });

    test('should keep submit button disabled until both fields filled', async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.submitButton).toBeDisabled();
      await loginPage.emailInput.fill(TEST_USER.email);
      await expect(loginPage.submitButton).toBeDisabled();
      await loginPage.passwordInput.fill(TEST_USER.password);
      await expect(loginPage.submitButton).toBeEnabled();
    });

    test('should navigate to register page via sign up link', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.signUpLink.click();
      await expect(loginPage.page).toHaveURL('/register');
    });
  });

  test.describe('Registration', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('should register successfully with valid details', async ({ registerPage, apiContext }) => {
      // Use a unique email so this test can run repeatedly
      const email = `test+${Date.now()}@fintrack.io`;
      await registerPage.goto();
      await registerPage.register('Test User', email, 'password123');
      await registerPage.page.waitForURL('/dashboard');
      await expect(registerPage.page).toHaveURL('/dashboard');
    });

    test('should show error for duplicate email', async ({ registerPage }) => {
      await registerPage.goto();
      await registerPage.register(TEST_USER.fullName, TEST_USER.email, 'password123');
      await expect(registerPage.emailError).toBeVisible();
    });

    test('should keep submit disabled until form is valid', async ({ registerPage }) => {
      await registerPage.goto();
      expect(await registerPage.isSubmitEnabled()).toBe(false);
      await registerPage.fullNameInput.fill('Test User');
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('password123');
      expect(await registerPage.isSubmitEnabled()).toBe(false);
      await registerPage.confirmPasswordInput.fill('password123');
      expect(await registerPage.isSubmitEnabled()).toBe(true);
    });

    test('should keep submit disabled when passwords do not match', async ({ registerPage }) => {
      await registerPage.goto();
      await registerPage.fullNameInput.fill('Test User');
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('password123');
      await registerPage.confirmPasswordInput.fill('different123');
      expect(await registerPage.isSubmitEnabled()).toBe(false);
    });
  });

  test.describe('Auth guards', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated user away from transactions', async ({ page }) => {
      await page.goto('/transactions');
      await expect(page).toHaveURL('/login');
    });
  });

});