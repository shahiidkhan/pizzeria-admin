// src/components/forms/ImageUpload.jsx
import { useRef, useState } from 'react';
import { X, Image } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ImageUpload({ label, value, onChange, error }) {
  const [preview, setPreview] = useState(undefined);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef();
  const displayPreview = preview === undefined ? value : preview;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLocalError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLocalError('Image must be 10MB or smaller.');
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalError('');
    setPreview(url);
    onChange?.(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setLocalError('');
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {displayPreview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[var(--border)] group">
          <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all',
            'border-[var(--border)] hover:border-brand-500 hover:bg-brand-500/5 text-[var(--text-muted)] hover:text-brand-500',
            error && 'border-red-400'
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
            <Image size={20} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs mt-0.5">PNG, JPG up to 10MB</p>
          </div>
        </button>
      )}
      {(error || localError) && <p className="text-xs text-red-400">{error || localError}</p>}
    </div>
  );
}
