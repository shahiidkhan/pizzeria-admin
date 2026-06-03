// src/pages/reviews/ReviewsPage.jsx
import { useState, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Trash2, Star } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useReviews } from '../../hooks/useReviews';

const columnHelper = createColumnHelper();

const StarRating = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={13}
        className={s <= value ? 'text-amber-400' : 'text-[var(--border)]'}
        fill={s <= value ? 'currentColor' : 'none'}
      />
    ))}
  </div>
);

export default function ReviewsPage() {
  const { reviews, loading, error, removeReview } = useReviews();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [deleting, setDeleting]         = useState(false);

  const filtered = ratingFilter ? reviews.filter(r => r.rating === ratingFilter) : reviews;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeReview(deleteTarget); } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('customer', {
      header: 'Customer',
      cell: info => {
        const customer = info.getValue();
        return (
          <div className="flex items-center gap-2.5">
            {customer?.avatar ? (
              <img src={customer.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                {customer?.name?.charAt(0) ?? '?'}
              </div>
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">{customer?.name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('productName', {
      header: 'Product',
      cell: info => (
        <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => (
        <div className="flex items-center gap-2">
          <StarRating value={info.getValue()} />
          <span className="text-xs font-bold text-[var(--text-primary)]">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('comment', {
      header: 'Comment',
      enableSorting: false,
      cell: info => (
        <p className="text-sm text-[var(--text-muted)] max-w-xs truncate">{info.getValue()}</p>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => {
        const raw  = info.getValue();
        const date = raw?.toDate ? raw.toDate() : new Date(raw);
        return (
          <span className="text-xs text-[var(--text-muted)]">
            {isNaN(date) ? '—' : date.toLocaleDateString()}
          </span>
        );
      },
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

  if (error) return <p className="text-red-400 p-6">Error loading reviews: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Reviews"
        subtitle={`${reviews.length} reviews · Avg rating: ${avgRating} ⭐`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reviews' }]}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setRatingFilter(0)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !ratingFilter
              ? 'bg-brand-500 text-white'
              : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50'
          }`}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button
            key={r}
            onClick={() => setRatingFilter(r)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              ratingFilter === r
                ? 'bg-brand-500 text-white'
                : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50'
            }`}
          >
            <Star size={11} fill={ratingFilter === r ? 'white' : 'currentColor'} /> {r} Stars
          </button>
        ))}
      </div>

      {loading
        ? <LoadingSpinner center message="Loading reviews..." />
        : <DataTable columns={columns} data={filtered} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review"
        message="Remove this review permanently?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
