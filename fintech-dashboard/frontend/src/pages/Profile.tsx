import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../api/profile';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        setFullName(profile.fullName);
        setEmail(profile.email);
      } catch {
        //
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileErrors({ fullName: 'Full name must be at least 2 characters' });
      return;
    }
    setProfileErrors({});
    setSaveLoading(true);
    try {
      const updated = await updateProfile(fullName.trim());
      updateUser(updated);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setProfileErrors({ general: msg || 'Failed to save profile' });
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Required';
    if (newPassword.length < 8) errs.newPassword = 'At least 8 characters';
    if (!/\d/.test(newPassword)) errs.newPassword = 'Must include a number';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; field?: string } } })?.response?.data;
      if (data?.field) {
        setPwErrors({ [data.field]: data.error || 'Error' });
      } else {
        setPwErrors({ general: data?.error || 'Failed to change password' });
      }
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    } catch {
      setToast({ message: 'Failed to delete account', type: 'error' });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }

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
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link to="/transactions" className="text-sm text-gray-600 hover:text-gray-900">Transactions</Link>
            <Link to="/profile" className="text-sm font-medium text-blue-600">Profile</Link>
            <button onClick={handleLogout} data-testid="logout-btn" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>

        {profileLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Profile info */}
            <section className="rounded-xl bg-white p-6 shadow-sm border">
              <h3 className="mb-4 text-base font-semibold text-gray-700">Profile Information</h3>
              {profileErrors.general && (
                <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600" data-testid="profile-error">{profileErrors.general}</p>
              )}
              <form onSubmit={handleSaveProfile} noValidate>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="display-name">
                    Display name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    data-testid="display-name-input"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      profileErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {profileErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600" data-testid="error-display-name">{profileErrors.fullName}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    data-testid="email-display"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <button
                  type="submit"
                  disabled={saveLoading}
                  data-testid="save-profile"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saveLoading ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </section>

            {/* Change password */}
            <section className="rounded-xl bg-white p-6 shadow-sm border">
              <h3 className="mb-4 text-base font-semibold text-gray-700">Change Password</h3>
              {pwErrors.general && (
                <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600" data-testid="password-error">{pwErrors.general}</p>
              )}
              <form onSubmit={handleChangePassword} noValidate>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="current-password">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="current-password"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      pwErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {pwErrors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600" data-testid="error-current-password">{pwErrors.currentPassword}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="new-password"
                    placeholder="Min 8 chars, must include a number"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      pwErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {pwErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-600" data-testid="error-new-password">{pwErrors.newPassword}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="confirm-password"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      pwErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {pwErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600" data-testid="error-confirm-password">{pwErrors.confirmPassword}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  data-testid="save-password"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {pwLoading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>

            {/* Danger zone */}
            <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-red-700">Danger Zone</h3>
              <p className="mb-4 text-sm text-gray-500">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="delete-account-btn"
                className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete account
              </button>
            </section>
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          data-testid="delete-account-modal"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete account?</h3>
            <p className="mb-6 text-sm text-gray-500">
              This will permanently delete your account and all your transactions. You cannot undo this.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                data-testid="cancel-delete"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                data-testid="confirm-delete"
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
