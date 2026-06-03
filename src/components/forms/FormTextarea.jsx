// src/components/forms/FormTextarea.jsx
import { cn } from '../../utils/cn';

export default function FormTextarea({ label, error, className, required, rows = 4, ...props }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        {...props}
        className={cn('input-field resize-none', error && 'border-red-400 focus:ring-red-400/40 focus:border-red-400')}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
