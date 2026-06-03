// src/pages/categories/CategoriesPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCategories } from '../../hooks/useCategories';

export default function CategoriesPage() {
  const { categories, loading, error, removeCategory } = useCategories();
  const [search, setSearch]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const filtered = categories.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await removeCategory(deleteTarget); } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (error) return <p className="text-red-400 p-6">Error loading categories: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Categories' }]}
        actions={
          <Link to="/categories/add" className="btn-primary">
            <Plus size={16} /> Add Category
          </Link>
        }
      />

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <LoadingSpinner center message="Loading categories..." />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-12">
          {search ? 'No categories match your search.' : 'No categories yet. Add your first one!'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cat => (
            <div key={cat.id} className="card p-0 overflow-hidden hover:shadow-card-md transition-all duration-200 group">
              <div className="relative h-36 overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Package size={32} className="text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base">{cat.name}</h3>
                    <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                      <Package size={11} /> {cat.itemCount ?? 0} items
                    </p>
                  </div>
                  <StatusBadge status={cat.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] truncate mr-3">{cat.description}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/categories/edit/${cat.id}`}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                  >
                    <Edit size={15} />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(cat.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message="Deleting this category may affect associated products. Continue?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
