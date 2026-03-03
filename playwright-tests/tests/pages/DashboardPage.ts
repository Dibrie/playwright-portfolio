import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  readonly logoutButton: Locator;
  readonly quickAddButton: Locator;
  readonly balanceCard: Locator;
  readonly incomeCard: Locator;
  readonly expensesCard: Locator;
  readonly spendingChart: Locator;
  readonly recentTransactions: Locator;
  readonly transactionRows: Locator;
  readonly viewAllLink: Locator;
  readonly navTransactions: Locator;
  readonly navProfile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoutButton = page.getByTestId('logout-btn');
    this.quickAddButton = page.getByTestId('quick-add-btn');
    this.balanceCard = page.getByTestId('card-balance');
    this.incomeCard = page.getByTestId('card-income');
    this.expensesCard = page.getByTestId('card-expenses');
    this.spendingChart = page.getByTestId('spending-chart');
    this.recentTransactions = page.getByTestId('recent-transactions');
    this.transactionRows = page.getByTestId('transaction-row');
    this.viewAllLink = page.getByRole('link', { name: 'View all' });
    this.navTransactions = page.getByRole('link', { name: 'Transactions' });
    this.navProfile = page.getByRole('link', { name: 'Profile' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getBalanceText(): Promise<string | null> {
    return this.balanceCard.locator('p.text-3xl').textContent();
  }

  async getIncomeText(): Promise<string | null> {
    return this.incomeCard.locator('p.text-3xl').textContent();
  }

  async getExpensesText(): Promise<string | null> {
    return this.expensesCard.locator('p.text-3xl').textContent();
  }

  async getRecentTransactionCount(): Promise<number> {
    return this.transactionRows.count();
  }

  async logout() {
    await this.logoutButton.click();
  }
}