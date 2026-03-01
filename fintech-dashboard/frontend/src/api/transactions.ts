import client from './client';
import { Transaction, TransactionListResponse, Summary, TransactionFilters } from '../types';

export async function getSummary(): Promise<Summary> {
  const { data } = await client.get<Summary>('/transactions/summary');
  return data;
}

export async function getTransactions(filters: Partial<TransactionFilters>): Promise<TransactionListResponse> {
  const params: Record<string, string> = {};

  if (filters.search) params.search = filters.search;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.category && filters.category.length > 0) params.category = filters.category.join(',');
  if (filters.type && filters.type !== 'all') params.type = filters.type;
  if (filters.minAmount) params.minAmount = filters.minAmount;
  if (filters.maxAmount) params.maxAmount = filters.maxAmount;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortDir) params.sortDir = filters.sortDir;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);

  const { data } = await client.get<TransactionListResponse>('/transactions', { params });
  return data;
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await client.post<Transaction>('/transactions', input);
  return data;
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const { data } = await client.put<Transaction>(`/transactions/${id}`, input);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await client.delete(`/transactions/${id}`);
}
