// src/components/charts/WeeklySalesChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const FALLBACK = [
  { day: 'Mon', sales: 0, revenue: 0 },
  { day: 'Tue', sales: 0, revenue: 0 },
  { day: 'Wed', sales: 0, revenue: 0 },
  { day: 'Thu', sales: 0, revenue: 0 },
  { day: 'Fri', sales: 0, revenue: 0 },
  { day: 'Sat', sales: 0, revenue: 0 },
  { day: 'Sun', sales: 0, revenue: 0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-card-lg">
        <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
        <p className="text-xs text-brand-400">Orders: <span className="font-bold text-white">{payload[0]?.value}</span></p>
        <p className="text-xs text-purple-400">Revenue: <span className="font-bold text-white">{formatCurrency(payload[1]?.value)}</span></p>
      </div>
    );
  }
  return null;
};

export default function WeeklySalesChart({ data }) {
  const chartData = data?.length ? data : FALLBACK;
  const totalOrders  = chartData.reduce((s, d) => s + (d.sales ?? 0), 0);
  const totalRevenue = chartData.reduce((s, d) => s + (d.revenue ?? 0), 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Weekly Sales</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {totalOrders} orders · {formatCurrency(totalRevenue)} revenue this week
          </p>
        </div>
        <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {totalOrders > 0 ? `${totalOrders} orders` : 'No data yet'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="day"    tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis                  tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="sales"   stroke="#f97316" strokeWidth={2.5} fill="url(#salesGrad)"   dot={false} />
          <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="w-3 h-0.5 bg-brand-500 rounded" /> Orders
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="w-3 h-0.5 bg-purple-500 rounded" /> Revenue (Rs.)
        </div>
      </div>
    </div>
  );
}
