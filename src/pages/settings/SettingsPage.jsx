// src/pages/settings/SettingsPage.jsx
import { Mail, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

function formatDateTime(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString();
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)] break-words">{value || 'Not available'}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, admin } = useAuth();
  const isDark = theme === 'dark';
  const adminName = admin?.name || user?.displayName || admin?.role || 'Admin';
  const adminEmail = admin?.email || user?.email || '';
  const avatarUrl = admin?.image || admin?.avatar || user?.photoURL || '';

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Admin preferences and account details"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="card p-6 space-y-5 xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              {isDark ? <Moon size={19} /> : <Sun size={19} />}
            </div>
            <div>
              <h3 className="section-title">Theme</h3>
              <p className="text-sm text-[var(--text-muted)]">{isDark ? 'Dark mode active' : 'Light mode active'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary w-full justify-center"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </section>

        <section className="card p-6 space-y-5 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={adminName}
                className="w-16 h-16 rounded-xl object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-500 text-white flex items-center justify-center text-xl font-bold">
                {adminName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="section-title">About Admin</h3>
              <p className="text-lg font-semibold text-[var(--text-primary)] truncate">{adminName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-brand-500" />
                  {admin?.role || 'Admin'}
                </span>
                {adminEmail && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={14} className="text-brand-500" />
                    {adminEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Name" value={adminName} />
            <InfoRow label="Email" value={adminEmail} />
            <InfoRow label="Role" value={admin?.role || 'Admin'} />
            <InfoRow
              label="Status"
              value={admin?.isActive === false ? 'Inactive' : 'Active'}
            />
            <InfoRow label="Admin ID" value={admin?.uid || admin?.id || user?.uid} />
            <InfoRow label="Last Sign In" value={formatDateTime(user?.metadata?.lastSignInTime || admin?.lastLogin)} />
          </div>

          <div className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3',
            admin?.isActive === false
              ? 'border-red-500/30 bg-red-500/10 text-red-500'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
          )}>
            <UserRound size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">
              {admin?.isActive === false
                ? 'This admin account is currently inactive.'
                : 'This admin account is active and allowed to access the panel.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
