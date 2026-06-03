// src/components/charts/MonthlyRevenueChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FALLBACK = MONTHS.map(m => ({ month: m, revenue: 0 }));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-card-lg">
        <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
        <p className="text-xs text-brand-400">Revenue: <span className="font-bold text-white">{formatCurrency(payload[0]?.value)}</span></p>
      </div>
    );
  }
  return null;
};

export default function MonthlyRevenueChart({ data }) {
  const chartData = data?.length ? data : FALLBACK;
  const maxVal = Math.max(...chartData.map(d => d.revenue), 1);
  const year   = new Date().getFullYear();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Monthly Revenue</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Full year performance</p>
        </div>
        <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20">{year}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `Rs. ${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.06)' }} />
          <Bar dataKey="revenue" radius={[5, 5, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.revenue === maxVal && maxVal > 0 ? '#f97316' : 'rgba(249,115,22,0.4)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
