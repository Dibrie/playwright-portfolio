export interface User {
  id: string;
  email: string;
  fullName: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface Summary {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface TransactionFilters {
  search: string;
  startDate: string;
  endDate: string;
  category: string[];
  type: 'all' | 'income' | 'expense';
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Salary',
  'Rent / Mortgage',
  'Entertainment',
  'Healthcare',
  'Freelance Income',
  'Utilities',
] as const;
