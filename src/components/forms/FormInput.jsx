// src/components/forms/FormInput.jsx
import { cn } from '../../utils/cn';

export default function FormInput({ label, error, className, required, ...props }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input {...props} className={cn('input-field', error && 'border-red-400 focus:ring-red-400/40 focus:border-red-400')} />
      {error && <p className="text-xs text-red-400 flex items-center gap-1">{error}</p>}
    </div>
  );
}
