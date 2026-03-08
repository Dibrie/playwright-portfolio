import { test, expect } from '../fixtures';

test.describe('Transactions', () => {

  test.describe('Page load', () => {
    test('should display transaction rows', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
    });

    test('should display 10 rows per page', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await expect(transactionsPage.transactionRows).toHaveCount(10);
    });

    test('should show correct page info', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      const info = await transactionsPage.getPageInfoText();
      expect(info).toContain('Page 1');
    });
  });

  test.describe('Search', () => {
    test('should filter rows by description', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.search('Tesco');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
      const count = await transactionsPage.transactionRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show empty state for no results', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.search('xyznonexistent999');
      await expect(transactionsPage.transactionRows).toHaveCount(0);
    });

    test('should restore rows after clearing search', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.search('xyznonexistent999');
      await expect(transactionsPage.transactionRows).toHaveCount(0);
      await transactionsPage.searchInput.clear();
      await expect(transactionsPage.transactionRows).toHaveCount(10);
    });
  });

  test.describe('Filters', () => {
    test('should filter by income type', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByType('income');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
      const count = await transactionsPage.transactionRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter by expense type', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByType('expense');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
      const count = await transactionsPage.transactionRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter by date range', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByDateRange('2026-03-01', '2026-03-31');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
      const count = await transactionsPage.transactionRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter by category', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByCategory(['Transport']);
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
      const count = await transactionsPage.transactionRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should filter by amount range', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByAmountRange('100', '500');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
    });

    test('should reset all filters', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.filterByType('income');
      await transactionsPage.search('Salary');
      await transactionsPage.reset();
      await expect(transactionsPage.transactionRows).toHaveCount(10);
    });
  });

  test.describe('Sorting', () => {
    test('should sort by amount when clicking amount header', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.sortAmount.click();
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
    });

    test('should toggle sort direction on second click', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.sortAmount.click();
      await transactionsPage.sortAmount.click();
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should have prev button disabled on first page', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      expect(await transactionsPage.isPrevDisabled()).toBe(true);
    });

    test('should navigate to next page', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.goToNextPage();
      const info = await transactionsPage.getPageInfoText();
      expect(info).toContain('Page 2');
    });

    test('should navigate back to previous page', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      await transactionsPage.goToNextPage();
      await transactionsPage.goToPrevPage();
      const info = await transactionsPage.getPageInfoText();
      expect(info).toContain('Page 1');
    });
  });

  test.describe('Add transaction', () => {
    test('should open modal on add button click', async ({ transactionsPage, transactionModalPage }) => {
      await transactionsPage.goto();
      await transactionsPage.addTransactionButton.click();
      await expect(transactionModalPage.submitButton).toBeVisible();
    });

    test('should add a new transaction and show in list', async ({ transactionsPage, transactionModalPage }) => {
      await transactionsPage.goto();
      await transactionsPage.addTransactionButton.click();
      await transactionModalPage.fillTransaction({
        type: 'expense',
        description: 'Playwright test transaction',
        amount: '42.00',
        category: 'Entertainment',
      });
      await transactionModalPage.submit();
      await expect(transactionModalPage.submitButton).not.toBeVisible();
      await transactionsPage.search('Playwright test transaction');
      await expect(transactionsPage.transactionRows.first()).toBeVisible();
    });
  });

  test.describe('Edit transaction', () => {
    test('should open edit modal on edit button click', async ({ transactionsPage, transactionModalPage }) => {
      await transactionsPage.goto();
      await transactionsPage.clickEditOnRow(0);
      await expect(transactionModalPage.submitButton).toBeVisible();
    });
  });

  test.describe('Export', () => {
    test('should trigger CSV download', async ({ transactionsPage }) => {
      await transactionsPage.goto();
      const downloadPromise = transactionsPage.page.waitForEvent('download');
      await transactionsPage.exportCsvButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

});