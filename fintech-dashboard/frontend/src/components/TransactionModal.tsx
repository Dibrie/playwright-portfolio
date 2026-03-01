import { useState, useEffect } from 'react';
import { Transaction, CATEGORIES } from '../types';
import { createTransaction, updateTransaction, deleteTransaction, TransactionInput } from '../api/transactions';

interface Props {
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

const today = new Date().toISOString().split('T')[0];

export default function TransactionModal({ transaction, onClose, onSaved }: Props) {
  const isEdit = !!transaction;

  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [date, setDate] = useState(transaction?.date ? transaction.date.slice(0, 10) : today);
  const [notes, setNotes] = useState(transaction?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Description is required';
    else if (description.length > 100) errs.description = 'Max 100 characters';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errs.amount = 'Must be a positive number';
    if (!category) errs.category = 'Category is required';
    if (!date) errs.date = 'Date is required';
    else if (new Date(date) > new Date()) errs.date = 'Date cannot be in the future';
    if (notes.length > 500) errs.notes = 'Max 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const input: TransactionInput = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date,
        notes: notes.trim() || undefined,
      };
      if (isEdit && transaction) {
        await updateTransaction(transaction.id, input);
      } else {
        await createTransaction(input);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; field?: string } } })?.response?.data;
      if (msg?.field) {
        setErrors({ [msg.field]: msg.error || 'Error' });
      } else {
        setErrors({ general: msg?.error || 'Something went wrong' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(transaction.id);
      onSaved();
      onClose();
    } catch {
      setErrors({ general: 'Failed to delete transaction' });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
      data-testid="transaction-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          {isEdit ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        {errors.general && (
          <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600" data-testid="modal-error">
            {errors.general}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Type */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <div className="flex gap-4">
              {(['income', 'expense'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    data-testid={`type-${t}`}
                    className="accent-blue-600"
                  />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="modal-description">
              Description
            </label>
            <input
              id="modal-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="modal-description"
              maxLength={100}
              placeholder="e.g. Grocery shopping"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-description">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="modal-amount">
              Amount (€)
            </label>
            <input
              id="modal-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="modal-amount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-amount">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="modal-category">
              Category
            </label>
            <select
              id="modal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="modal-category"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-category">{errors.category}</p>
            )}
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="modal-date">
              Date
            </label>
            <input
              id="modal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="modal-date"
              max={today}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-date">{errors.date}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="modal-notes">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="modal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="modal-notes"
              maxLength={500}
              rows={2}
              placeholder="Optional notes…"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-0.5 text-right text-xs text-gray-400">{notes.length}/500</p>
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600" data-testid="error-notes">{errors.notes}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                data-testid="modal-cancel"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="modal-delete"
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="modal-submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <span data-testid="modal-loading-spinner" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                isEdit ? 'Save Changes' : 'Add Transaction'
              )}
            </button>
          </div>
        </form>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 p-6"
            data-testid="delete-confirm-dialog"
          >
            <div className="text-center">
              <p className="mb-4 text-gray-700">Are you sure you want to delete this transaction?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  data-testid="delete-cancel"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  data-testid="delete-confirm"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
