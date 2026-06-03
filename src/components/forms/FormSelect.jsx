// src/components/forms/FormSelect.jsx
import { cn } from '../../utils/cn';

export default function FormSelect({ label, error, options = [], placeholder = 'Select...', className, required, ...props }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        {...props}
        className={cn(
          'input-field appearance-none',
          error && 'border-red-400 focus:ring-red-400/40 focus:border-red-400'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
