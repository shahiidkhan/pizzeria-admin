import { Clock, DollarSign, Gift, MapPin, Package, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import MonthlyRevenueChart from '../../components/charts/MonthlyRevenueChart';
import PopularProductsChart from '../../components/charts/PopularProductsChart';
import WeeklySalesChart from '../../components/charts/WeeklySalesChart';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { formatCurrency } from '../../utils/formatCurrency';

export default function DashboardPage() {
  const { stats, recentOrders, topProducts, branches, chartData, loading } = useDashboardStats();

  const openBranches = branches.filter(b => (b.status ? b.status === 'open' : !!b.isOpen)).length;
  const maxBranchOrders = Math.max(...branches.map(branch => branch.ordersToday ?? 0), 1);

  const statCards = [
    {
      title: 'Total Orders',
      value: loading ? '-' : stats?.total?.toLocaleString() ?? '0',
      icon: ShoppingCart,
      color: 'brand',
      subtitle: 'All time',
    },
    {
      title: 'Total Revenue',
      value: loading ? '-' : formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      color: 'green',
      subtitle: 'All time',
    },
    {
      title: 'Total Products',
      value: loading ? '-' : String(stats?.productCount ?? 0),
      icon: Package,
      color: 'blue',
      subtitle: 'In catalogue',
    },
    {
      title: 'Active Branches',
      value: loading ? '-' : `${openBranches} / ${branches.length}`,
      icon: MapPin,
      color: 'amber',
      subtitle: `${branches.length - openBranches} temporarily closed`,
    },
    {
      title: 'Pending Orders',
      value: loading ? '-' : String(stats?.pending ?? 0),
      icon: Clock,
      color: 'red',
      subtitle: 'Needs attention',
    },
    {
      title: 'Active Deals',
      value: loading ? '-' : String(stats?.activeDeals ?? 0),
      icon: Gift,
      color: 'purple',
      subtitle: 'Currently available',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1"><WeeklySalesChart data={chartData.weekly} /></div>
        <div className="xl:col-span-1"><MonthlyRevenueChart data={chartData.monthly} /></div>
        <div className="xl:col-span-1"><PopularProductsChart data={chartData.popular} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors">View all</Link>
          </div>

          {loading ? (
            <LoadingSpinner center />
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Order ID', 'Customer', 'Branch', 'Total', 'Status'].map(h => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-brand-500">{order.id}</td>
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)] whitespace-nowrap">{order.customer?.name || 'Customer'}</td>
                      <td className="py-3 pr-4 text-[var(--text-muted)] whitespace-nowrap text-xs">{order.branch?.name || order.branchName || '-'}</td>
                      <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">{formatCurrency(order.total)}</td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Top Products</h3>
            <Link to="/products" className="text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors">View all</Link>
          </div>

          {loading ? (
            <LoadingSpinner center />
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No ordered products yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-muted)] w-4">#{i + 1}</span>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{p.category || 'Product'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{p.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {branches.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[var(--border)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Branch Performance</h4>
              <div className="space-y-2.5">
                {branches.map(b => {
                  const pct = Math.round(((b.ordersToday ?? 0) / maxBranchOrders) * 100);
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">
                          {(b.location || b.name || 'Branch').replace(' Branch', '')}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{b.ordersToday ?? 0} orders</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
