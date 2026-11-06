import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, MapPin, Check, Loader2, BellRing } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../hooks/useAuth.jsx';
import ThemeToggle from '../common/ThemeToggle';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/products/add': 'Add Product',
  '/categories': 'Categories',
  '/categories/add': 'Add Category',
  '/deals': 'Deals',
  '/deals/add': 'Add Deal',
  '/offers': 'Offers',
  '/offers/add': 'Add Offer',
  '/menu': 'Menu Management',
  '/orders': 'Orders',
  '/reviews': 'Reviews',
  '/branches': 'Branches',
  '/admins': 'Admin Users',
  '/settings': 'Settings',
};

function formatRelativeTime(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} day ago`;
}

function formatBadgeCount(count) {
  return count > 99 ? '99+' : count;
}

export default function Navbar({
  onToggleMobile,
  admin,
  notifications = [],
  unreadCount = 0,
  markAsRead,
  acknowledgeBellNotifications,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loggingOut } = useAuth();
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationRef = useRef(null);
  const push = usePushNotifications(admin, user);
  const { branches } = useBranches();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'Dashboard';

  const orderedNotifications = useMemo(
    () => [...notifications].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [notifications]
  );

  const selectedBranch = useMemo(
    () => branches.find(branch => branch.id === selectedBranchId) ?? branches[0],
    [branches, selectedBranchId],
  );

  const handleProfileNavigation = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (!notifOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // Auth context stores logout error if needed
    }
  };

  return (
    <header className="h-16 flex items-center gap-3 px-4 lg:px-6 bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-20">
      <button
        onClick={onToggleMobile}
        className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <Menu size={20} />
      </button>

      <h1 className="page-title hidden sm:block">{title}</h1>
      <div className="flex-1" />

      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 w-48 lg:w-64 transition-all"
        />
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setBranchOpen((o) => !o);
            setNotifOpen(false);
            setProfileOpen(false);
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:border-brand-500/50 transition-all"
        >
          <MapPin size={14} className="text-brand-500" />
          <span className="max-w-28 truncate">{selectedBranch?.location || selectedBranch?.name || 'Branches'}</span>
          <ChevronDown size={14} />
        </button>
        {branchOpen && (
          <div className="absolute right-0 top-11 w-52 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-card-lg py-1 z-50 animate-fade-in">
            {branches.length === 0 ? (
              <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">No branches yet.</div>
            ) : branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranchId(b.id);
                  setBranchOpen(false);
                }}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {b.location || b.name}
                {selectedBranch?.id === b.id && <Check size={14} className="text-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <ThemeToggle />

      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => {
            const nextOpen = !notifOpen;
            setNotifOpen(nextOpen);
            setBranchOpen(false);
            setProfileOpen(false);
            if (nextOpen && unreadCount > 0) {
              acknowledgeBellNotifications?.();
            }
          }}
          className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-all"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold leading-5 text-center shadow-sm">
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-11 w-72 max-h-[min(28rem,calc(100vh-5rem))] bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-card-lg z-50 animate-fade-in overflow-y-auto">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="font-semibold text-sm text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => acknowledgeBellNotifications?.()} className="badge bg-brand-500/10 text-brand-500">
                  {unreadCount} new
                </button>
              )}
            </div>
            {push.configured && push.permission !== 'granted' && (
              <button
                type="button"
                onClick={push.enable}
                disabled={push.enabling || push.permission === 'denied'}
                className="w-full px-4 py-2.5 border-b border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {push.enabling ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                {push.permission === 'denied' ? 'Push blocked in browser' : 'Enable push alerts'}
              </button>
            )}
            {!push.configured && (
              <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                Add VITE_FIREBASE_VAPID_KEY to enable push alerts.
              </div>
            )}
            {orderedNotifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--text-muted)]">No notifications yet.</div>
            ) : (
              orderedNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) void markAsRead?.(n.id);
                    if (n.route) {
                      setNotifOpen(false);
                      navigate(n.route);
                    }
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-[var(--border)] last:border-0',
                    !n.read && 'bg-brand-500/5'
                  )}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">{n.text || n.title || 'Notification'}</p>
                  {n.message && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setProfileOpen((o) => !o);
            setBranchOpen(false);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all"
        >
          <img
            src="https://i.pravatar.cc/32?img=68"
            alt="Admin"
            className="w-8 h-8 rounded-full border-2 border-brand-500/40 object-cover"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{admin?.role || 'Admin'}</p>
            <p className="text-xs text-[var(--text-muted)]">{admin?.email || ''}</p>
          </div>
          <ChevronDown size={14} className="hidden lg:block text-[var(--text-muted)]" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-12 w-44 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-card-lg py-1 z-50 animate-fade-in">
            <button
              onClick={() => handleProfileNavigation('/admins')}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              My Profile
            </button>
            <button
              onClick={() => handleProfileNavigation('/settings')}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Settings
            </button>
            <div className="divider my-1" />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2',
                loggingOut
                  ? 'text-[var(--text-muted)] cursor-wait'
                  : 'text-red-400 hover:bg-red-500/10'
              )}
            >
              {loggingOut && <Loader2 size={14} className="animate-spin shrink-0" />}
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
