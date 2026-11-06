import { useMemo, useState } from 'react';
import { Search, Trophy, Users } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { useOrders } from '../../hooks/useOrders';
import { formatDateTime, toDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatCurrency';

function getCustomerKey(order) {
  return order.userId || order.customer?.phone || order.customer?.email || order.customer?.name || 'unknown';
}

function buildProductCustomerHistory(orders) {
  const products = new Map();

  orders.forEach(order => {
    const customerKey = getCustomerKey(order);
    const customer = {
      id: customerKey,
      name: order.customer?.name || 'Customer',
      email: order.customer?.email || '',
      phone: order.customer?.phone || order.phone || '',
    };

    (order.items || []).forEach(item => {
      const productId = item.productId || item.id || item.name;
      if (!productId) return;

      const quantity = Number(item.quantity ?? item.qty ?? 1);
      const revenue = Number(item.subtotal ?? quantity * Number(item.price || 0));
      const product = products.get(productId) || {
        id: productId,
        name: item.name || 'Product',
        image: item.image || '',
        totalQuantity: 0,
        totalRevenue: 0,
        customers: new Map(),
      };
      const currentCustomer = product.customers.get(customerKey) || {
        ...customer,
        orderCount: 0,
        quantity: 0,
        revenue: 0,
        lastOrderAt: null,
      };
      const orderDate = order.createdAt;
      const lastOrderAt = currentCustomer.lastOrderAt
        ? [currentCustomer.lastOrderAt, orderDate].sort((a, b) => {
            const dateA = toDate(a);
            const dateB = toDate(b);
            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
          })[0]
        : orderDate;

      currentCustomer.orderCount += 1;
      currentCustomer.quantity += quantity;
      currentCustomer.revenue += revenue;
      currentCustomer.lastOrderAt = lastOrderAt;
      product.totalQuantity += quantity;
      product.totalRevenue += revenue;
      product.customers.set(customerKey, currentCustomer);
      products.set(productId, product);
    });
  });

  return [...products.values()]
    .map(product => ({
      ...product,
      customers: [...product.customers.values()]
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 5),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity || b.totalRevenue - a.totalRevenue);
}

export default function TopCustomersPage() {
  const { orders, loading, error } = useOrders();
  const [search, setSearch] = useState('');

  const productHistory = useMemo(() => buildProductCustomerHistory(orders), [orders]);
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return productHistory;

    return productHistory.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.customers.some(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
      ),
    );
  }, [productHistory, search]);

  if (error) return <p className="text-red-400 p-6">Error loading customer history: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Top Customers"
        subtitle="Product-wise customer purchase history"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Top Customers' }]}
      />

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          placeholder="Search product or customer..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <LoadingSpinner center message="Loading top customers..." />
      ) : filteredHistory.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={30} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No product-wise customer history found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredHistory.map(product => (
            <section key={product.id} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-brand-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="section-title truncate">{product.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {product.totalQuantity} items sold · {formatCurrency(product.totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {['Customer', 'Orders', 'Qty', 'Revenue', 'Last Order'].map(header => (
                        <th key={header} className="pb-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pr-4">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {product.customers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-xs font-bold text-brand-500">#{index + 1}</span>
                            <div>
                              <p className="font-semibold text-[var(--text-primary)] whitespace-nowrap">{customer.name}</p>
                              <p className="text-xs text-[var(--text-muted)] whitespace-nowrap">{customer.phone || customer.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{customer.orderCount}</td>
                        <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{customer.quantity}</td>
                        <td className="py-3 pr-4 font-semibold text-[var(--text-primary)]">{formatCurrency(customer.revenue)}</td>
                        <td className="py-3 pr-4 text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDateTime(customer.lastOrderAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
