// src/components/forms/FormToggle.jsx
import { cn } from '../../utils/cn';

export default function FormToggle({ label, checked, onChange, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {label && <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>}
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          checked ? 'bg-brand-500' : 'bg-slate-600'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
