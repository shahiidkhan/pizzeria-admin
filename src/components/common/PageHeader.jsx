// src/components/common/PageHeader.jsx
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-brand-500 transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-[var(--text-secondary)]">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight size={12} />}
              </span>
            ))}
          </div>
        )}
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
