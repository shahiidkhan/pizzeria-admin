// src/layouts/AdminLayout.jsx
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useSidebar } from '../hooks/useSidebar';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { cn } from '../utils/cn';

export default function AdminLayout() {
  const { user, admin, loading } = useAuth();
  const { collapsed, mobileOpen, toggleCollapse, toggleMobile, closeMobile } = useSidebar();

  if (loading) return <LoadingSpinner center message="Checking session..." />;
  if (!user || !admin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={closeMobile}
      />
      <div className={cn(
        'transition-all duration-300',
        'lg:ml-60',
        collapsed && 'lg:ml-16'
      )}>
        <Navbar
          collapsed={collapsed}
          onToggleMobile={toggleMobile}
          admin={admin}
        />
        <main className="p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
