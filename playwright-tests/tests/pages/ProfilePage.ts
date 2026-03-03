import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;

  // Profile section
  readonly displayNameInput: Locator;
  readonly emailDisplay: Locator;
  readonly saveProfileButton: Locator;

  // Password section
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly savePasswordButton: Locator;

  // Danger zone
  readonly deleteAccountButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page.getByTestId('display-name-input');
    this.emailDisplay = page.getByTestId('email-display');
    this.saveProfileButton = page.getByTestId('save-profile');
    this.currentPasswordInput = page.getByTestId('current-password');
    this.newPasswordInput = page.getByTestId('new-password');
    this.confirmPasswordInput = page.getByTestId('confirm-password');
    this.savePasswordButton = page.getByTestId('save-password');
    this.deleteAccountButton = page.getByTestId('delete-account-btn');
    this.cancelDeleteButton = page.getByTestId('cancel-delete');
    this.confirmDeleteButton = page.getByTestId('confirm-delete');
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async updateDisplayName(name: string) {
    await this.displayNameInput.clear();
    await this.displayNameInput.fill(name);
    await this.saveProfileButton.click();
  }

  async changePassword(current: string, newPassword: string, confirm?: string) {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirm ?? newPassword);
    await this.savePasswordButton.click();
  }

  async deleteAccount() {
    await this.deleteAccountButton.click();
    await this.confirmDeleteButton.click();
  }

  async cancelDelete() {
    await this.deleteAccountButton.click();
    await this.cancelDeleteButton.click();
  }

  async isEmailReadOnly(): Promise<boolean> {
    return this.emailDisplay.isDisabled();
  }
}