// src/components/common/StatCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function StatCard({ title, value, icon: Icon, color = 'brand', trend, trendValue, subtitle }) {
  const colorMap = {
    brand:  'bg-brand-500/10 text-brand-500',
    blue:   'bg-blue-500/10 text-blue-500',
    green:  'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    amber:  'bg-amber-500/10 text-amber-500',
    red:    'bg-red-500/10 text-red-500',
  };

  return (
    <div className="card p-5 hover:shadow-card-md transition-all duration-200 group animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
          {trendValue !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-emerald-500' : 'text-red-400'
            )}>
              {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{trendValue}% vs last week</span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', colorMap[color] || colorMap.brand)}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
    </div>
  );
}
