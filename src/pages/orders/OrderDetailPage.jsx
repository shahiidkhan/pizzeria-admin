import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useOrder } from '../../hooks/useOrders';
import { ORDER_STATUS_CONFIG } from '../../services/orderService';
import { addMinutes, formatDateTime, toDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUSES = ['processing', 'onTheWay', 'delivered', 'cancelled'];

function statusLabel(status) {
  return ORDER_STATUS_CONFIG[status]?.label || 'Order Processing';
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { order, loading, error, updateStatus, allowCancellation } = useOrder(id);

  if (loading) return <LoadingSpinner center message="Loading order..." />;
  if (error) return <p className="text-red-400 p-6">Error: {error}</p>;
  if (!order) return <p className="text-[var(--text-muted)] p-6">Order not found.</p>;

  const customerConfirmed = !!(order.customerConfirmed || order.confirmedDelivered);
  const lifecycleEnded = customerConfirmed || order.status === 'cancelled';
  const placedAt = order.createdAt;
  const estimatedDeliveryAt = order.estimatedDeliveryAt || addMinutes(order.createdAt, 45);
  const deliveredAt = order.deliveredAt || order.confirmedAt || order.confirmedDeliveredAt;
  const cancellationDeadline = toDate(order.cancellationDeadline);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={`Order ${order.id}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Orders', path: '/orders' },
          { label: order.id },
        ]}
        actions={<Link to="/orders" className="btn-secondary"><ArrowLeft size={15} /> Back</Link>}
      />

      <div className="card p-5">
        <h3 className="section-title mb-4">Order Status</h3>
        <div className="flex items-center gap-0">
          {STATUSES.filter(status => status !== 'cancelled').map((status, index, statuses) => {
            const activeIndex = statuses.indexOf(order.status === 'cancelled' ? 'processing' : order.status);
            const done = index <= activeIndex && order.status !== 'cancelled';
            const cfg = ORDER_STATUS_CONFIG[status];
            return (
              <div key={status} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] whitespace-nowrap hidden sm:block">{cfg.label}</span>
                </div>
                {index < statuses.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${done && index < activeIndex ? 'bg-brand-500' : 'bg-[var(--border)]'}`} />
                )}
              </div>
            );
          })}
          {order.status === 'cancelled' && (
            <div className="ml-4"><StatusBadge status="cancelled" /></div>
          )}
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={order.status === status || lifecycleEnded}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                order.status === status
                  ? 'bg-brand-500 text-white border-brand-500 cursor-default'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-brand-500 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {ORDER_STATUS_CONFIG[status]?.label}
            </button>
          ))}
          <button
            onClick={allowCancellation}
            disabled={lifecycleEnded || order.status === 'delivered'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Allow 5 min cancellation
          </button>
        </div>

        {customerConfirmed && (
          <p className="text-xs text-emerald-500 mt-3">
            Customer confirmed this delivery at {formatDateTime(order.confirmedAt || order.confirmedDeliveredAt)}.
          </p>
        )}
        {order.cancellationAllowed && cancellationDeadline && !customerConfirmed && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Cancellation window expires at {formatDateTime(cancellationDeadline)}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="section-title mb-4">Ordered Items</h3>
            {order.items.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No items found for this order.</p>
            ) : (
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${item.productId || item.name}-${index}`} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border)] last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Qty {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(item.subtotal)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
              {[
                ['Subtotal', formatCurrency(order.subtotal)],
                ['Tax', formatCurrency(order.tax)],
                ['Delivery Fee', formatCurrency(order.deliveryFee)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
                <span>Total</span>
                <span className="text-brand-500">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="section-title mb-4">Customer</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {order.customer?.name?.charAt(0) || '?'}
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{order.customer?.name || 'Customer'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Mail size={14} />{order.customer?.email || '-'}</div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Phone size={14} />{order.customer?.phone || '-'}</div>
              <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><MapPin size={14} className="mt-0.5 shrink-0" />{order.address || order.customer?.address || '-'}</div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="section-title mb-1">Order Info</h3>
            <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <Navigation size={14} className="mt-0.5 shrink-0" />
              <span>{order.address || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><MapPin size={14} /><span>{order.branch?.name || '-'}</span></div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Phone size={14} /><span>{order.branch?.contact || '-'}</span></div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><CreditCard size={14} /><span>{order.paymentMethod || '-'}</span></div>
            <div className="pt-2"><StatusBadge status={order.status} /></div>
            <p className="text-xs text-[var(--text-muted)]">{statusLabel(order.status)}</p>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="section-title mb-1">Delivery Time</h3>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock size={14} /><span>Placed: {formatDateTime(placedAt)}</span></div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock size={14} /><span>Estimated: {formatDateTime(estimatedDeliveryAt)}</span></div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock size={14} /><span>Updated: {formatDateTime(order.updatedAt)}</span></div>
            {(order.status === 'delivered' || deliveredAt) && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Clock size={14} /><span>Delivered: {formatDateTime(deliveredAt)}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
