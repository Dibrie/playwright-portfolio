import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTransactions, deleteTransaction } from '../api/transactions';
import { useAuth } from '../hooks/useAuth';
import TransactionModal from '../components/TransactionModal';
import { Transaction, TransactionFilters, CATEGORIES } from '../types';

const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  startDate: '',
  endDate: '',
  category: [],
  type: 'all',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Transactions() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTransactions = useCallback(async (f: TransactionFilters) => {
    setLoading(true);
    try {
      const result = await getTransactions(f);
      setTransactions(result.transactions);
      setPagination(result.pagination);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions(filters);
  }, [filters, loadTransactions]);

  function setFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function handleSearchChange(val: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilter('search', val);
    }, 300);
  }

  function toggleCategory(cat: string) {
    setFilters((prev) => {
      const cats = prev.category.includes(cat)
        ? prev.category.filter((c) => c !== cat)
        : [...prev.category, cat];
      return { ...prev, category: cats, page: 1 };
    });
  }

  function toggleSort(col: string) {
    setFilters((prev) => {
      if (prev.sortBy === col) {
        return { ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc', page: 1 };
      }
      return { ...prev, sortBy: col, sortDir: 'desc', page: 1 };
    });
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleExportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sortIcon = (col: string) => {
    if (filters.sortBy !== col) return ' ↕';
    return filters.sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">FinTrack</h1>
          <nav className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link to="/transactions" className="text-sm font-medium text-blue-600">Transactions</Link>
            <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">Profile</Link>
            <button onClick={handleLogout} data-testid="logout-btn" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Transactions</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              data-testid="export-csv"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => { setSelectedTxn(null); setShowModal(true); }}
              data-testid="add-transaction-btn"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm border space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search description…"
              defaultValue={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              data-testid="search-input"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Date range */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)}
              data-testid="date-start"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)}
              data-testid="date-end"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Type */}
            <select
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value as TransactionFilters['type'])}
              data-testid="type-filter"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Amount range */}
            <input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => setFilter('minAmount', e.target.value)}
              data-testid="amount-min"
              min="0"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => setFilter('maxAmount', e.target.value)}
              data-testid="amount-max"
              min="0"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Category multi-select */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((v) => !v)}
                data-testid="category-filter"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filters.category.length === 0
                  ? 'All categories'
                  : `${filters.category.length} selected`}
              </button>
              {categoryDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.category.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        data-testid={`category-option-${cat.replace(/[\s/&]/g, '-')}`}
                        className="accent-blue-600"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={resetFilters}
              data-testid="reset-filters"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 text-left hover:bg-gray-100"
                  onClick={() => toggleSort('date')}
                  data-testid="sort-date"
                >
                  Date{sortIcon('date')}
                </th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th
                  className="cursor-pointer px-4 py-3 text-right hover:bg-gray-100"
                  onClick={() => toggleSort('amount')}
                  data-testid="sort-amount"
                >
                  Amount{sortIcon('amount')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2" data-testid="table-loading">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center" data-testid="empty-state">
                    <p className="text-gray-500">No transactions match your filters.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    data-testid="transaction-row"
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-500">{formatDate(txn.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{txn.description}</td>
                    <td className="px-4 py-3 text-gray-500">{txn.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          txn.type === 'income'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setSelectedTxn(txn); setShowModal(true); }}
                        data-testid="edit-transaction-btn"
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500">
              <span data-testid="page-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  data-testid="pagination-prev"
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  data-testid="pagination-next"
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <TransactionModal
          transaction={selectedTxn}
          onClose={() => { setShowModal(false); setSelectedTxn(null); }}
          onSaved={() => loadTransactions(filters)}
        />
      )}
    </div>
  );
}
