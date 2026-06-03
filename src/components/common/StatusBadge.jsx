// src/components/common/StatusBadge.jsx
import { cn } from '../../utils/cn';

const variants = {
  // Order statuses
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  onTheWay:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  delivered:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  cancelled:  'bg-red-500/10 text-red-400 border border-red-500/20',
  // Generic
  active:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  inactive:   'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  expired:    'bg-red-500/10 text-red-400 border border-red-500/20',
  open:       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed:     'bg-red-500/10 text-red-400 border border-red-500/20',
  // Roles
  'Super Admin':    'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Branch Manager': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  // Types
  Veg:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Non-Veg':'bg-red-500/10 text-red-400 border border-red-500/20',
};

const labels = {
  processing: 'Order Processing',
  onTheWay:   'Order On Delivery',
  delivered:  'Order Delivered',
  cancelled:  'Order Cancelled',
};

export default function StatusBadge({ status, className }) {
  const display = labels[status] ?? status;
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[status] ?? 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      className
    )}>
      {display}
    </span>
  );
}
