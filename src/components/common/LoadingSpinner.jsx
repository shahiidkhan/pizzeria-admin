// src/components/common/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', center = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={center ? 'flex items-center justify-center py-12' : 'inline-flex'}>
      <div className={`${sizes[size]} border-2 border-[var(--border)] border-t-brand-500 rounded-full animate-spin`} />
    </div>
  );
}
