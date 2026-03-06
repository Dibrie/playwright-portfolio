import { test, expect } from '../fixtures';

test.describe('Dashboard', () => {

  test('should display summary cards with values', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.balanceCard).toBeVisible();
    await expect(dashboardPage.incomeCard).toBeVisible();
    await expect(dashboardPage.expensesCard).toBeVisible();
  });

  test('should display non-zero balance', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const balance = await dashboardPage.getBalanceText();
    expect(balance).not.toBe('€0.00');
  });

  test('should display spending chart', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.spendingChart).toBeVisible();
  });

  test('should display exactly 5 recent transactions', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.recentTransactions).toBeVisible();
    await expect(dashboardPage.transactionRows).toHaveCount(5);
  });

  test('should navigate to transactions page via view all link', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.viewAllLink.click();
    await expect(dashboardPage.page).toHaveURL('/transactions');
  });

  test('should navigate to transactions page via nav', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.navTransactions.click();
    await expect(dashboardPage.page).toHaveURL('/transactions');
  });

  test('should navigate to profile page via nav', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.navProfile.click();
    await expect(dashboardPage.page).toHaveURL('/profile');
  });

  test('should open add transaction modal', async ({ dashboardPage, transactionModalPage }) => {
    await dashboardPage.goto();
    await dashboardPage.quickAddButton.click();
    await expect(transactionModalPage.submitButton).toBeVisible();
  });

  test('should close modal on cancel', async ({ dashboardPage, transactionModalPage }) => {
    await dashboardPage.goto();
    await dashboardPage.quickAddButton.click();
    await transactionModalPage.cancel();
    await expect(transactionModalPage.submitButton).not.toBeVisible();
  });

  test('should add a transaction and update recent list', async ({ dashboardPage, transactionModalPage }) => {
    await dashboardPage.goto();
    await dashboardPage.quickAddButton.click();
    await transactionModalPage.fillTransaction({
      type: 'expense',
      description: 'Test transaction',
      amount: '25.00',
      category: 'Entertainment',
    });
    await transactionModalPage.submit();
    await expect(transactionModalPage.submitButton).not.toBeVisible();
    await expect(dashboardPage.recentTransactions).toContainText('Test transaction');
  });

  test('should logout and redirect to login', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.logout();
    await expect(dashboardPage.page).toHaveURL('/login');
  });

});