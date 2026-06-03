import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Pizza, Lock, Mail, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth.jsx';
import ThemeToggle from '../../components/common/ThemeToggle';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState('');
  const { user, admin, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  });

  useEffect(() => {
    if (!loading && user && admin) navigate('/dashboard', { replace: true });
  }, [user, admin, loading, navigate]);

  const onSubmit = async (values) => {
    setAuthError('');
    try {
      await authService.login(values.email, values.password, !!values.remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Failed to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 flex relative">
      {/* Floating Theme Toggle */}
      <ThemeToggle className="absolute top-4 right-4 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-sm z-50" />

      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
              <Pizza size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Pizzeria</span>
          </div>
          <p className="text-slate-500 text-sm">Admin Panel</p>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your
            <br />
            <span className="text-brand-500">pizzeria</span> like
            <br />a pro.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            One dashboard to manage orders, products, branches, deals, and everything in between.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { val: '4', label: 'Branches' },
            { val: '1.2k', label: 'Orders/mo' },
            { val: '12+', label: 'Products' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{s.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg-primary)] transition-colors duration-300">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Pizza size={18} className="text-white" />
            </div>
            <span className="text-[var(--text-primary)] font-bold text-lg">Pizzeria Admin</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h1>
            <p className="text-[var(--text-secondary)] text-sm">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@pizzeria.com"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-150"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="********"
                  className="w-full pl-10 pr-12 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="w-4 h-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-brand-500 focus:ring-brand-500/50 cursor-pointer"
                />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <button type="button" className="text-sm text-brand-500 hover:text-brand-400 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
            {authError && <p className="text-xs text-red-400">{authError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
