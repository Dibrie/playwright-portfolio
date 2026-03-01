import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSummary, getTransactions } from '../api/transactions';
import { useAuth } from '../hooks/useAuth';
import TransactionModal from '../components/TransactionModal';
import { Summary, Transaction } from '../types';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, txns] = await Promise.all([
        getSummary(),
        getTransactions({ sortBy: 'date', sortDir: 'desc', page: 1, limit: 5 }),
      ]);
      setSummary(sum);
      setRecentTransactions(txns.transactions);
    } catch {
      // handled by axios interceptor if 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">FinTrack</h1>
          <nav className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-blue-600">Dashboard</Link>
            <Link to="/transactions" className="text-sm text-gray-600 hover:text-gray-900">Transactions</Link>
            <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">Profile</Link>
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.fullName?.split(' ')[0] ?? 'there'}
            </h2>
            <p className="text-sm text-gray-500">Here's your financial overview</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            data-testid="quick-add-btn"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Transaction
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20" data-testid="dashboard-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div
                data-testid="card-balance"
                className="rounded-xl bg-white p-6 shadow-sm border"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Balance</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary ? formatCurrency(summary.balance) : '—'}
                </p>
              </div>
              <div
                data-testid="card-income"
                className="rounded-xl bg-white p-6 shadow-sm border"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">This Month Income</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {summary ? formatCurrency(summary.monthIncome) : '—'}
                </p>
              </div>
              <div
                data-testid="card-expenses"
                className="rounded-xl bg-white p-6 shadow-sm border"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">This Month Expenses</p>
                <p className="mt-2 text-3xl font-bold text-red-500">
                  {summary ? formatCurrency(summary.monthExpenses) : '—'}
                </p>
              </div>
            </div>

            {/* Chart + Recent transactions */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Spending chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm border" data-testid="spending-chart">
                <h3 className="mb-4 text-base font-semibold text-gray-700">Spending by Category (This Month)</h3>
                {summary && summary.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ category }) => category}
                      >
                        {summary.categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-gray-400">No expense data for this month</p>
                )}
              </div>

              {/* Recent transactions */}
              <div className="rounded-xl bg-white p-6 shadow-sm border">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-700">Recent Transactions</h3>
                  <Link to="/transactions" className="text-xs text-blue-600 hover:underline">
                    View all
                  </Link>
                </div>
                <ul data-testid="recent-transactions" className="divide-y divide-gray-100">
                  {recentTransactions.length === 0 ? (
                    <li className="py-6 text-center text-sm text-gray-400">No transactions yet</li>
                  ) : (
                    recentTransactions.map((txn) => (
                      <li
                        key={txn.id}
                        data-testid="transaction-row"
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{txn.description}</p>
                          <p className="text-xs text-gray-400">{txn.category} · {formatDate(txn.date)}</p>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            txn.type === 'income' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
