// src/pages/products/ProductsPage.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Search, Edit, Trash2, Star } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormToggle from '../../components/forms/FormToggle';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/formatCurrency';

const columnHelper = createColumnHelper();

export default function ProductsPage() {
  const { products, loading, error, removeProduct, toggleAvailability } = useProducts();
  const [globalFilter, setGlobalFilter]   = useState('');
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deleting, setDeleting]           = useState(false);

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products],
  );

  const filtered = useMemo(() => {
    let d = products;
    if (categoryFilter !== 'All') d = d.filter(p => p.category === categoryFilter);
    if (globalFilter) d = d.filter(p =>
      p.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      p.category?.toLowerCase().includes(globalFilter.toLowerCase()),
    );
    return d;
  }, [products, globalFilter, categoryFilter]);

  const handleToggle = async (id, val) => {
    try { await toggleAvailability(id, val); } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeProduct(deleteTarget); } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('image', {
      header: 'Image',
      enableSorting: false,
      cell: info => (
        <img src={info.getValue()} alt="product" className="w-11 h-11 rounded-xl object-cover border border-[var(--border)]" />
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Product',
      cell: info => (
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-sm">{info.getValue()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">
            {Array.isArray(info.row.original.ingredients)
              ? info.row.original.ingredients.join(', ')
              : info.row.original.ingredients}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">{info.getValue()}</span>,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: info => <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => (
        <div className="flex items-center gap-1.5">
          <Star size={13} className="text-amber-400" fill="currentColor" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{info.getValue() ?? '—'}</span>
        </div>
      ),
    }),
    columnHelper.accessor('availability', {
      header: 'Available',
      cell: info => (
        <FormToggle
          checked={!!info.getValue()}
          onChange={v => handleToggle(info.row.original.id, v)}
        />
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/edit/${info.row.original.id}`}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-400 transition-all"
          >
            <Edit size={15} />
          </Link>
          <button
            onClick={() => setDeleteTarget(info.row.original.id)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [products]);

  if (error) return <p className="text-red-400 p-6">Error loading products: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products total`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Products' }]}
        actions={
          <Link to="/products/add" className="btn-primary">
            <Plus size={16} /> Add Product
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            placeholder="Search products..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === c
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500/50 hover:text-brand-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner center message="Loading products..." /> : <DataTable columns={columns} data={filtered} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
