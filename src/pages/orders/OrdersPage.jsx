import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Search } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS_CONFIG } from '../../services/orderService';
import { formatDateTime } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatCurrency';

const columnHelper = createColumnHelper();
const STATUS_FILTERS = ['All', 'processing', 'onTheWay', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { orders, loading, error } = useOrders();
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    const search = globalFilter.toLowerCase();
    let data = orders;
    if (statusFilter !== 'All') data = data.filter(order => order.status === statusFilter);
    if (search) {
      data = data.filter(order =>
        order.id?.toLowerCase().includes(search) ||
        order.customer?.name?.toLowerCase().includes(search) ||
        order.customer?.email?.toLowerCase().includes(search) ||
        order.customer?.phone?.toLowerCase().includes(search) ||
        order.branch?.name?.toLowerCase().includes(search),
      );
    }
    return data;
  }, [orders, globalFilter, statusFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'Order ID',
      cell: info => <span className="font-mono text-xs font-bold text-brand-500">{info.getValue()}</span>,
    }),
    columnHelper.accessor('customer.name', {
      header: 'Customer',
      cell: info => (
        <div>
          <p className="font-semibold text-sm text-[var(--text-primary)]">{info.getValue() || 'Customer'}</p>
          <p className="text-xs text-[var(--text-muted)]">{info.row.original.customer?.email || '-'}</p>
          <p className="text-xs text-[var(--text-muted)]">{info.row.original.customer?.phone || '-'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('branch.name', {
      header: 'Branch',
      cell: info => (
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{info.getValue() || '-'}</p>
          <p className="text-xs text-[var(--text-muted)]">{info.row.original.branch?.contact || '-'}</p>
          <p className="text-xs text-[var(--text-muted)] capitalize">{info.row.original.branch?.status || '-'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('items', {
      header: 'Items',
      enableSorting: false,
      cell: info => (
        <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]">
          {(info.getValue() ?? []).length} items
        </span>
      ),
    }),
    columnHelper.accessor('total', {
      header: 'Total',
      cell: info => <span className="font-bold text-[var(--text-primary)]">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('paymentMethod', {
      header: 'Payment',
      cell: info => <span className="text-xs text-[var(--text-muted)]">{info.getValue() || '-'}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => <span className="text-xs text-[var(--text-muted)]">{formatDateTime(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <Link
          to={`/orders/${info.row.original.id}`}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-brand-500/10 hover:text-brand-500 transition-all inline-flex"
        >
          <Eye size={15} />
        </Link>
      ),
    }),
  ], []);

  if (error) return <p className="text-red-400 p-6">Error loading orders: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total orders`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Orders' }]}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            placeholder="Search by order ID or customer..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                statusFilter === status
                  ? 'bg-brand-500 text-white'
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-brand-500'
              }`}
            >
              {status === 'All' ? 'All' : ORDER_STATUS_CONFIG[status]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <LoadingSpinner center message="Loading orders..." />
        : <DataTable columns={columns} data={filtered} />}
    </div>
  );
}
