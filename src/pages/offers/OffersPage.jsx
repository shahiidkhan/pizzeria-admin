// src/pages/offers/OffersPage.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useOffers } from '../../hooks/useOffers';
import { formatCurrency } from '../../utils/formatCurrency';

const columnHelper = createColumnHelper();

export default function OffersPage() {
  const { offers, loading, error, removeOffer } = useOffers();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeOffer(deleteTarget); } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('productImage', {
      header: 'Product',
      enableSorting: false,
      cell: info => (
        <div className="flex items-center gap-3">
          {info.getValue() && (
            <img src={info.getValue()} alt="" className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
          )}
          <span className="text-sm font-medium text-[var(--text-primary)]">{info.row.original.productName}</span>
        </div>
      ),
    }),
    columnHelper.accessor('originalPrice', {
      header: 'Original',
      cell: info => <span className="text-sm line-through text-[var(--text-muted)]">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('discountPrice', {
      header: 'Offer Price',
      cell: info => <span className="text-sm font-bold text-brand-500">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('discountPercent', {
      header: 'Discount',
      cell: info => (
        <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">{info.getValue() ?? 0}% off</span>
      ),
    }),
    columnHelper.accessor('expiryDate', {
      header: 'Expires',
      cell: info => {
        const expired = new Date(info.getValue()) < new Date();
        return (
          <span className={`text-xs ${expired ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
            {info.getValue() ?? '—'}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button
          onClick={() => setDeleteTarget(info.row.original.id)}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <Trash2 size={15} />
        </button>
      ),
    }),
  ], []);

  if (error) return <p className="text-red-400 p-6">Error loading offers: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Offers"
        subtitle={`${offers.length} offers`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Offers' }]}
        actions={<Link to="/offers/add" className="btn-primary"><Plus size={16} /> Add Offer</Link>}
      />

      {loading
        ? <LoadingSpinner center message="Loading offers..." />
        : <DataTable columns={columns} data={offers} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Offer"
        message="Remove this offer?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
