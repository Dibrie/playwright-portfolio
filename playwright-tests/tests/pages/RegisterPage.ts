import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;

  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly signInLink: Locator;
  readonly emailError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.getByTestId('fullname-input');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
    this.emailError = page.getByTestId('error-email');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(fullName: string, email: string, password: string, confirmPassword?: string) {
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword ?? password);
    await this.submitButton.click();
  }

  async getEmailError(): Promise<string | null> {
    return this.emailError.textContent();
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.submitButton.isEnabled();
  }
}