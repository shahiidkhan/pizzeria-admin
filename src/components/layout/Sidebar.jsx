// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Pizza, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth.jsx';
import ThemeToggle from '../common/ThemeToggle';

const ITEM_COLORS = {
  'Dashboard':   { color: 'blue',   text: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-500/10 dark:bg-blue-500/15',     border: 'border-blue-500/20 dark:border-blue-500/30' },
  'Products':    { color: 'orange', text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-500/10 dark:bg-orange-500/15', border: 'border-orange-500/20 dark:border-orange-500/30' },
  'Categories':  { color: 'green',  text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', border: 'border-emerald-500/20 dark:border-emerald-500/30' },
  'Deals':       { color: 'purple', text: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-500/10 dark:bg-purple-500/15', border: 'border-purple-500/20 dark:border-purple-500/30' },
  'Offers':      { color: 'red',    text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-500/10 dark:bg-red-500/15',       border: 'border-red-500/20 dark:border-red-500/30' },
  'Menu':        { color: 'indigo', text: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', border: 'border-indigo-500/20 dark:border-indigo-500/30' },
  'Orders':      { color: 'cyan',   text: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',     border: 'border-cyan-500/20 dark:border-cyan-500/30' },
  'Reviews':     { color: 'yellow', text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/10 dark:bg-amber-500/15',   border: 'border-amber-500/20 dark:border-amber-500/30' },
  'Branches':    { color: 'teal',   text: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-500/10 dark:bg-teal-500/15',     border: 'border-teal-500/20 dark:border-teal-500/30' },
  'Admin Users': { color: 'pink',   text: 'text-pink-600 dark:text-pink-400',       bg: 'bg-pink-500/10 dark:bg-pink-500/15',     border: 'border-pink-500/20 dark:border-pink-500/30' },
  'Settings':    { color: 'gray',   text: 'text-slate-600 dark:text-slate-400',     bg: 'bg-slate-500/10 dark:bg-slate-500/15',   border: 'border-slate-500/20 dark:border-slate-500/30' },
};

const getNavItemClasses = (label, isActive) => {
  const cfg = ITEM_COLORS[label] || ITEM_COLORS['Settings'];
  if (isActive) {
    return cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-150',
      cfg.bg,
      cfg.text,
      cfg.border
    );
  }
  return cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border border-transparent transition-all duration-150',
    label === 'Dashboard'   && 'text-blue-600/70 dark:text-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/10',
    label === 'Products'    && 'text-orange-600/70 dark:text-orange-400/60 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/5 dark:hover:bg-orange-500/10',
    label === 'Categories'  && 'text-emerald-600/70 dark:text-emerald-400/60 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
    label === 'Deals'       && 'text-purple-600/70 dark:text-purple-400/60 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/5 dark:hover:bg-purple-500/10',
    label === 'Offers'      && 'text-red-600/70 dark:text-red-400/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10',
    label === 'Menu'        && 'text-indigo-600/70 dark:text-indigo-400/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10',
    label === 'Orders'      && 'text-cyan-600/70 dark:text-cyan-400/60 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10',
    label === 'Reviews'     && 'text-amber-600/70 dark:text-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
    label === 'Branches'    && 'text-teal-600/70 dark:text-teal-400/60 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/5 dark:hover:bg-teal-500/10',
    label === 'Admin Users' && 'text-pink-600/70 dark:text-pink-400/60 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-500/5 dark:hover:bg-pink-500/10',
    label === 'Settings'    && 'text-slate-600/70 dark:text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-500/5 dark:hover:bg-slate-500/10'
  );
};

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const navigate = useNavigate();
  const { logout, loggingOut, logoutError, clearLogoutError } = useAuth();

  const handleLogout = async () => {
    clearLogoutError();
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // logoutError is set in context for display
    }
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) => getNavItemClasses(item.label, isActive)}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Logo + theme toggle */}
      <div
        className={cn(
          'border-b border-[var(--sidebar-border)]',
          collapsed
            ? 'flex flex-col items-center gap-2 px-2 py-4'
            : 'flex items-center justify-between gap-2 px-4 py-5'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
            <Pizza size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight text-[var(--text-primary)]">Pizzeria</p>
              <p className="text-[var(--text-muted)] text-xs">Admin Panel</p>
            </div>
          )}
        </div>
        <ThemeToggle
          iconSize={collapsed ? 16 : 18}
          className={cn('shrink-0', collapsed && 'p-1.5')}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        {logoutError && !collapsed && (
          <p className="mb-2 px-3 text-xs text-red-500" role="alert">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium transition-all duration-150 cursor-pointer',
            loggingOut
              ? 'text-[var(--text-muted)] cursor-wait'
              : 'text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500'
          )}
        >
          {loggingOut ? (
            <Loader2 size={18} className="shrink-0 animate-spin" />
          ) : (
            <LogOut size={18} className="shrink-0" />
          )}
          {!collapsed && <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] z-30 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {renderSidebarContent()}
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full
                     flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]
                     transition-all duration-150 shadow-md cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] z-50 transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        {renderSidebarContent()}
      </aside>
    </>
  );
}
