// src/components/charts/PopularProductsChart.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#f97316', '#a855f7', '#3b82f6', '#10b981', '#64748b'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-card-lg">
        <p className="text-xs font-bold text-white">{payload[0].name}</p>
        <p className="text-xs text-[#94a3b8]">Orders: <span className="text-white font-semibold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export default function PopularProductsChart({ data }) {
  const chartData = data?.length
    ? data.map((d, i) => ({ ...d, color: d.color ?? COLORS[i % COLORS.length] }))
    : [];

  return (
    <div className="card p-5">
      <div className="mb-5">
        <h3 className="section-title">Popular Products</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Top selling items this month</p>
      </div>
      {chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-[var(--text-muted)]">
          No ordered products yet.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-[var(--text-secondary)] truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
