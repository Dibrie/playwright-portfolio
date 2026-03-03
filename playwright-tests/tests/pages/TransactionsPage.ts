import { Page, Locator } from '@playwright/test';

export class TransactionsPage {
  readonly page: Page;

  readonly searchInput: Locator;
  readonly dateStart: Locator;
  readonly dateEnd: Locator;
  readonly typeFilter: Locator;
  readonly amountMin: Locator;
  readonly amountMax: Locator;
  readonly categoryFilter: Locator;
  readonly resetFilters: Locator;
  readonly exportCsvButton: Locator;
  readonly addTransactionButton: Locator;
  readonly transactionRows: Locator;
  readonly sortDate: Locator;
  readonly sortAmount: Locator;
  readonly pageInfo: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly editButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input');
    this.dateStart = page.getByTestId('date-start');
    this.dateEnd = page.getByTestId('date-end');
    this.typeFilter = page.getByTestId('type-filter');
    this.amountMin = page.getByTestId('amount-min');
    this.amountMax = page.getByTestId('amount-max');
    this.categoryFilter = page.getByTestId('category-filter');
    this.resetFilters = page.getByTestId('reset-filters');
    this.exportCsvButton = page.getByTestId('export-csv');
    this.addTransactionButton = page.getByTestId('add-transaction-btn');
    this.transactionRows = page.getByTestId('transaction-row');
    this.sortDate = page.getByTestId('sort-date');
    this.sortAmount = page.getByTestId('sort-amount');
    this.pageInfo = page.getByTestId('page-info');
    this.paginationPrev = page.getByTestId('pagination-prev');
    this.paginationNext = page.getByTestId('pagination-next');
    this.editButtons = page.getByTestId('edit-transaction-btn');
  }

  async goto() {
    await this.page.goto('/transactions');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByType(type: 'all' | 'income' | 'expense') {
    await this.typeFilter.selectOption(type);
  }

  async filterByDateRange(start: string, end: string) {
    await this.dateStart.fill(start);
    await this.dateEnd.fill(end);
  }

  async filterByAmountRange(min: string, max: string) {
    await this.amountMin.fill(min);
    await this.amountMax.fill(max);
  }

  async reset() {
    await this.resetFilters.click();
  }

  async getRowCount(): Promise<number> {
    return this.transactionRows.count();
  }

  async getPageInfoText(): Promise<string | null> {
    return this.pageInfo.textContent();
  }

  async goToNextPage() {
    await this.paginationNext.click();
  }

  async goToPrevPage() {
    await this.paginationPrev.click();
  }

  async isPrevDisabled(): Promise<boolean> {
    return this.paginationPrev.isDisabled();
  }

  async isNextDisabled(): Promise<boolean> {
    return this.paginationNext.isDisabled();
  }

  async clickEditOnRow(index: number) {
    await this.editButtons.nth(index).click();
  }
  
  async filterByCategory(categories: string[]) {
  await this.categoryFilter.click();
  for (const category of categories) {
    const testId = `category-option-${category.replace(/ & /g, '---').replace(/ \/ /g, '---').replace(/ /g, '-')}`;
    await this.page.getByTestId(testId).check();
  }
  // Click away to close the dropdown
  await this.page.keyboard.press('Escape');
}
}