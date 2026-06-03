import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, GripVertical, Upload } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { dealService } from '../../services/dealService';
import { offerService } from '../../services/offerService';
import { productService } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useMenuUploads } from '../../hooks/useMenuUploads';
import { formatCurrency } from '../../utils/formatCurrency';

const TYPE_COLORS = {
  Product: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Deal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Offer: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);
  const { admin, user } = useAuth();
  const { uploads, loading: uploadsLoading, error: uploadsError, uploadMenu } = useMenuUploads();

  useEffect(() => {
    Promise.all([
      productService.getAll(),
      dealService.getAll(),
      offerService.getAll(),
    ]).then(([products, deals, offers]) => {
      const menuItems = [
        ...products.slice(0, 4).map(p => ({
          id: `p-${p.id}`,
          type: 'Product',
          name: p.name,
          image: p.image ?? '',
          price: formatCurrency(p.price),
          visible: p.isAvailable ?? p.availability !== false,
        })),
        ...deals.filter(d => d.isActive).slice(0, 2).map(d => ({
          id: `d-${d.id}`,
          type: 'Deal',
          name: d.name,
          image: d.image ?? '',
          price: formatCurrency(d.dealPrice),
          visible: true,
        })),
        ...offers.filter(o => o.status === 'active').slice(0, 2).map(o => ({
          id: `o-${o.id}`,
          type: 'Offer',
          name: o.productName,
          image: o.productImage ?? '',
          price: formatCurrency(o.discountPrice),
          visible: true,
        })),
      ];
      setItems(menuItems);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleVisible = (id) =>
    setItems(prev => prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');

    // Supported file types validation (PNG, JPG, WEBP, PDF)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload PNG, JPG, WEBP, or PDF.');
      return;
    }

    // Maximum file size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadMenu(file, {
        uid: user?.uid || admin?.uid || null,
        name: admin?.name || admin?.email || user?.email || 'Admin',
        email: admin?.email || user?.email || '',
      }, setUploadProgress);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload menu.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Menu Management"
        subtitle="Manage homepage menu visibility and order"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Menu' }]}
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary" disabled={uploading}>
              {uploading ? `${uploadProgress}%` : <><Upload size={16} /> Upload Menu</>}
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={loading}>
              {saved ? 'Saved' : 'Save Order'}
            </button>
          </>
        }
      />

      {(uploadError || uploadsError) && (
        <p className="text-sm text-red-400">{uploadError || uploadsError}</p>
      )}

      {loading ? (
        <LoadingSpinner center message="Building menu from Firestore..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="section-title">Menu Items</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {items.filter(i => i.visible).length} visible of {items.length}
                </p>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-10">
                  No menu items found. Add products, deals, or offers first.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-tertiary)] transition-colors ${!item.visible ? 'opacity-50' : ''}`}
                    >
                      <button className="text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--text-primary)] transition-colors">
                        <GripVertical size={18} />
                      </button>
                      <span className="text-xs font-mono text-[var(--text-muted)] w-5">{idx + 1}</span>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.price}</p>
                      </div>
                      <span className={`badge border text-xs ${TYPE_COLORS[item.type]}`}>{item.type}</span>
                      <button
                        onClick={() => toggleVisible(item.id)}
                        className={`p-2 rounded-lg transition-all ${
                          item.visible
                            ? 'text-brand-500 hover:bg-brand-500/10'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="section-title mb-3">Uploaded Menus</h3>
              {uploadsLoading ? (
                <LoadingSpinner center />
              ) : uploads.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No menu uploads yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {uploads.map(upload => (
                    <a
                      key={upload.id}
                      href={upload.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-[var(--border)] p-3 hover:border-brand-500/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{upload.fileName}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {upload.fileType === 'application/pdf' ? 'PDF' : 'Image'}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-3">Summary</h3>
              <div className="space-y-2.5">
                {['Product', 'Deal', 'Offer'].map(type => {
                  const count = items.filter(i => i.type === type && i.visible).length;
                  const total = items.filter(i => i.type === type).length;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`badge border text-xs ${TYPE_COLORS[type]}`}>{type}s</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{count}/{total} visible</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card p-5">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Toggle the eye icon to show or hide items on the customer-facing menu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
