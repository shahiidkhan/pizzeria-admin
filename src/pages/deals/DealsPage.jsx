// src/pages/deals/DealsPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useDeals } from '../../hooks/useDeals';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/formatCurrency';

export default function DealsPage() {
  const { deals, loading, error, toggleActive, removeDeal } = useDeals();
  const { products } = useProducts();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const getProducts = (ids = []) =>
    ids.map(id => products.find(p => p.id === id)).filter(Boolean);

  const handleToggle = async (id, current) => {
    try { await toggleActive(id, !current); } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeDeal(deleteTarget); } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (error) return <p className="text-red-400 p-6">Error loading deals: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Deals"
        subtitle={`${deals.length} deals configured`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Deals' }]}
        actions={<Link to="/deals/add" className="btn-primary"><Plus size={16} /> Add Deal</Link>}
      />

      {loading ? (
        <LoadingSpinner center message="Loading deals..." />
      ) : deals.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-12">No deals yet. Create your first deal!</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {deals.map(deal => {
            const dealProducts = getProducts(deal.products ?? []);
            return (
              <div key={deal.id} className={`card p-5 transition-all duration-200 ${!deal.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Tag size={20} className="text-brand-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{deal.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{deal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(deal.id, deal.isActive)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                    >
                      {deal.isActive
                        ? <ToggleRight size={20} className="text-brand-500" />
                        : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(deal.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Products preview */}
                {dealProducts.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {dealProducts.map(p => (
                      <div key={p.id} className="flex flex-col items-center gap-1 shrink-0">
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-[var(--border)]" />
                        <span className="text-[10px] text-[var(--text-muted)] max-w-[48px] truncate text-center">{p.name?.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] line-through">{formatCurrency(deal.originalPrice)}</p>
                      <p className="text-lg font-bold text-brand-500">{formatCurrency(deal.dealPrice)}</p>
                    </div>
                    <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">
                      {deal.discount ?? 0}% off
                    </span>
                  </div>
                  <StatusBadge status={deal.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Deal"
        message="Are you sure you want to delete this deal?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
