import { Page, Locator } from '@playwright/test';

export class TransactionModalPage {
  readonly page: Page;

  readonly descriptionInput: Locator;
  readonly amountInput: Locator;
  readonly categorySelect: Locator;
  readonly dateInput: Locator;
  readonly notesInput: Locator;
  readonly typeIncome: Locator;
  readonly typeExpense: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.descriptionInput = page.getByTestId('modal-description');
    this.amountInput = page.getByTestId('modal-amount');
    this.categorySelect = page.getByTestId('modal-category');
    this.dateInput = page.getByTestId('modal-date');
    this.notesInput = page.getByTestId('modal-notes');
    this.typeIncome = page.getByTestId('type-income');
    this.typeExpense = page.getByTestId('type-expense');
    this.submitButton = page.getByTestId('modal-submit');
    this.cancelButton = page.getByTestId('modal-cancel');
  }

  async fillTransaction({
    type = 'expense',
    description,
    amount,
    category,
    date,
    notes,
  }: {
    type?: 'income' | 'expense';
    description: string;
    amount: string;
    category: string;
    date?: string;
    notes?: string;
  }) {
    if (type === 'income') await this.typeIncome.check();
    else await this.typeExpense.check();

    await this.descriptionInput.fill(description);
    await this.amountInput.fill(amount);
    await this.categorySelect.selectOption(category);

    if (date) await this.dateInput.fill(date);
    if (notes) await this.notesInput.fill(notes);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async isVisible(): Promise<boolean> {
    return this.submitButton.isVisible();
  }
}