// src/components/common/ConfirmDialog.jsx
import { AlertTriangle, Loader2, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  variant = 'danger',
  loading = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-card-lg p-6 w-full max-w-sm animate-fade-in">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
            <p className="text-sm text-[var(--text-muted)]">{message ?? 'Are you sure you want to proceed? This action cannot be undone.'}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onCancel} disabled={loading} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? 'btn-danger text-sm' : 'btn-primary text-sm'}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
