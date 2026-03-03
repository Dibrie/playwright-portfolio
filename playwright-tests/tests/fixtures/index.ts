import { test as base, request } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { TransactionModalPage } from '../pages/TransactionsModalPage';
import { ProfilePage } from '../pages/ProfilePage';
import { API_BASE } from '../helpers/constants';

type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  dashboardPage: DashboardPage;
  transactionsPage: TransactionsPage;
  transactionModalPage: TransactionModalPage;
  profilePage: ProfilePage;
  apiContext: Awaited<ReturnType<typeof request.newContext>>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page));
  },
  transactionModalPage: async ({ page }, use) => {
    await use(new TransactionModalPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  apiContext: async ({}, use) => {
    const context = await request.newContext({ baseURL: API_BASE });
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';