import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly signUpLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.rememberMeCheckbox = page.getByTestId('remember-me');
    this.submitButton = page.getByTestId('submit-button');
    this.signUpLink = page.getByRole('link', { name: 'Sign up' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string, rememberMe = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (rememberMe) await this.rememberMeCheckbox.check();
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
   return this.errorMessage.textContent();
  }
}