import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { app, auth, db, storage } from '../../firebase/firebase';
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

const ACCEPTED_MENU_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const MAX_MENU_SIZE = 20 * 1024 * 1024;

function formatFileSize(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(bytes / 1024, 1).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function logFirebaseContext({ collectionName = '', docPath = '', storagePath = '', payload = null } = {}) {
  console.log('Firebase projectId:', app.options.projectId);
  console.log('Firebase storageBucket:', app.options.storageBucket);
  console.log('Auth UID:', auth.currentUser?.uid || null);
  console.log('Auth Email:', auth.currentUser?.email || null);
  if (collectionName) console.log('Target collection:', collectionName);
  if (docPath) console.log('Target doc path:', docPath);
  if (storagePath) console.log('Target storage path:', storagePath);
  if (payload) console.log('Payload:', payload);
}

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [actionId, setActionId] = useState('');
  const inputRef = useRef(null);
  const { admin, user } = useAuth();
  const {
    uploads,
    loading: uploadsLoading,
    error: uploadsError,
    uploadMenu,
    setActiveUpload,
    removeUpload,
  } = useMenuUploads();

  const activeUpload = useMemo(
    () => uploads.find(upload => upload.isActive) ?? uploads[0] ?? null,
    [uploads],
  );

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
          image: p.imageUrl ?? p.image ?? '',
          price: formatCurrency(p.price),
          visible: p.isAvailable ?? p.availability !== false,
        })),
        ...deals.filter(d => d.isActive).slice(0, 2).map(d => ({
          id: `d-${d.id}`,
          type: 'Deal',
          name: d.name,
          image: d.imageUrl ?? d.image ?? '',
          price: formatCurrency(d.dealPrice),
          visible: true,
        })),
        ...offers.filter(o => o.status === 'active').slice(0, 2).map(o => ({
          id: `o-${o.id}`,
          type: 'Offer',
          name: o.productName,
          image: o.imageUrl ?? o.image ?? o.productImage ?? '',
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

  const testFirebaseAccess = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Admin must be logged in to upload');

    const adminPath = `admins/${currentUser.uid}`;
    try {
      console.log('Firebase diagnostic step:', 'read admin doc');
      logFirebaseContext({ collectionName: 'admins', docPath: adminPath });
      const adminRef = doc(db, 'admins', currentUser.uid);
      const adminSnap = await getDoc(adminRef);
      console.log('Admin doc exists:', adminSnap.exists(), adminSnap.data());
      if (!adminSnap.exists()) {
        throw new Error('This user is logged in but is not registered as admin.');
      }
    } catch (error) {
      console.error('Firebase diagnostic failed at:', 'getDoc admins/{uid}', error?.code, error?.message, error?.customData, error);
      throw error;
    }

    const testDocPath = 'menuUploads/_permission_test';
    const testPayload = {
      recordType: 'permissionTest',
      uid: currentUser.uid,
      email: currentUser.email || '',
      updatedAt: serverTimestamp(),
    };

    try {
      console.log('Firebase diagnostic step:', 'write menu upload permission test');
      logFirebaseContext({ collectionName: 'menuUploads', docPath: testDocPath, payload: testPayload });
      await setDoc(doc(db, 'menuUploads', '_permission_test'), testPayload);
      console.log('Firestore test write passed:', testDocPath);
    } catch (error) {
      console.error('Firebase diagnostic failed at:', 'setDoc menuUploads/_permission_test', error?.code, error?.message, error?.customData, error);
      throw error;
    }

    try {
      console.log('Firebase diagnostic step:', 'delete menu upload permission test');
      logFirebaseContext({ collectionName: 'menuUploads', docPath: testDocPath });
      await deleteDoc(doc(db, 'menuUploads', '_permission_test'));
      console.log('Firestore test delete passed:', testDocPath);
    } catch (error) {
      console.error('Firebase diagnostic failed at:', 'deleteDoc menuUploads/_permission_test', error?.code, error?.message, error?.customData, error);
      throw error;
    }

    const testStoragePath = 'menuUploads/_permission_test.txt';
    const testStorageRef = ref(storage, testStoragePath);
    try {
      console.log('Firebase diagnostic step:', 'upload storage permission test');
      logFirebaseContext({ storagePath: testStoragePath });
      await uploadBytes(testStorageRef, new Blob(['permission test'], { type: 'text/plain' }));
      console.log('Storage test upload passed:', testStoragePath);
    } catch (error) {
      console.error('Firebase diagnostic failed at:', 'uploadBytes menuUploads/_permission_test.txt', error?.code, error?.message, error?.customData, error);
      throw error;
    }

    try {
      console.log('Firebase diagnostic step:', 'get storage test download URL');
      logFirebaseContext({ storagePath: testStoragePath });
      const downloadURL = await getDownloadURL(testStorageRef);
      console.log('Storage test getDownloadURL passed:', downloadURL);
    } catch (error) {
      console.error('Firebase diagnostic failed at:', 'getDownloadURL menuUploads/_permission_test.txt', error?.code, error?.message, error?.customData, error);
      throw error;
    } finally {
      deleteObject(testStorageRef).catch(error => {
        console.error('Firebase diagnostic cleanup failed:', error?.code, error?.message, error?.customData, error);
      });
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!ACCEPTED_MENU_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload PNG, JPG, WEBP, or PDF.');
      return;
    }

    if (file.size > MAX_MENU_SIZE) {
      setUploadError('File size exceeds the 20MB limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      console.log('Menu upload auth uid:', user?.uid || null);
      console.log('Menu upload auth email:', user?.email || admin?.email || null);
      await testFirebaseAccess();
      const storagePath = `menuUploads/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '-')}`;
      logFirebaseContext({
        collectionName: 'menuUploads',
        docPath: 'menuUploads/{generatedUploadId}',
        storagePath,
        payload: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      });
      await uploadMenu(file, {
        uid: user?.uid || admin?.uid || null,
        name: admin?.name || admin?.email || user?.email || 'Admin',
        email: admin?.email || user?.email || '',
      }, setUploadProgress);
    } catch (err) {
      console.error('Menu upload failed:', err?.code, err?.message, err?.customData, err);
      const message = err.message || 'Failed to upload menu.';
      setUploadError(message);
      alert(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleActivateUpload = async (upload) => {
    if (!upload?.id || upload.isActive) return;
    setActionId(upload.id);
    setUploadError('');
    try {
      await setActiveUpload(upload.id);
    } catch (err) {
      setUploadError(err.message || 'Failed to activate menu.');
    } finally {
      setActionId('');
    }
  };

  const handleRemoveUpload = async (upload) => {
    if (!upload?.id) return;
    setActionId(upload.id);
    setUploadError('');
    try {
      await removeUpload(upload);
    } catch (err) {
      setUploadError(err.message || 'Failed to remove menu.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Menu Management"
        subtitle="Upload and publish the customer-facing menu"
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
              {uploading ? <><Loader2 size={16} className="animate-spin" /> {uploadProgress}%</> : <><Upload size={16} /> Upload Menu</>}
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
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="section-title">Live App Menu</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">This is the menu currently shown in the app.</p>
                </div>
                {activeUpload && (
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>
              {uploadsLoading ? (
                <LoadingSpinner center />
              ) : !activeUpload ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-[var(--border)] p-6 text-center hover:border-brand-500/50 transition-colors"
                >
                  <Upload size={24} className="mx-auto text-brand-500 mb-2" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Upload a menu file</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, WEBP, or PDF up to 20MB.</p>
                </button>
              ) : (
                <div className="space-y-3">
                  {activeUpload.fileKind === 'image' || activeUpload.fileType?.startsWith('image/') ? (
                    <img
                      src={activeUpload.fileUrl}
                      alt={activeUpload.fileName}
                      className="w-full aspect-[4/3] object-cover rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]"
                    />
                  ) : (
                    <div className="aspect-[4/3] rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] flex flex-col items-center justify-center text-center p-4">
                      <FileText size={36} className="text-brand-500 mb-2" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">PDF Menu</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 truncate max-w-full">{activeUpload.fileName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{activeUpload.fileName}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Published {formatDate(activeUpload.activatedAt || activeUpload.uploadedAt)}
                    </p>
                  </div>
                  <a
                    href={activeUpload.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full justify-center"
                  >
                    <ExternalLink size={16} /> Open Menu
                  </a>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-3">Menu Library</h3>
              {uploadsLoading ? (
                <LoadingSpinner center />
              ) : uploads.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No uploaded menus yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {uploads.map(upload => {
                    const Icon = upload.fileKind === 'pdf' || upload.fileType === 'application/pdf' ? FileText : ImageIcon;
                    const busy = actionId === upload.id;
                    return (
                      <div
                        key={upload.id}
                        className="rounded-lg border border-[var(--border)] p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                            <Icon size={17} className="text-brand-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{upload.fileName}</p>
                              {upload.isActive && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {formatFileSize(upload.fileSize)} - {formatDate(upload.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handleActivateUpload(upload)}
                            disabled={upload.isActive || busy}
                            className="btn-secondary flex-1 justify-center py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : upload.isActive ? 'Live' : 'Publish'}
                          </button>
                          <a
                            href={upload.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-brand-500 hover:border-brand-500/50 transition-colors"
                            aria-label={`Open ${upload.fileName}`}
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveUpload(upload)}
                            disabled={busy}
                            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            aria-label={`Remove ${upload.fileName}`}
                          >
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-3">Upload Standard</h3>
              <div className="space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
                <p>Accepted formats: PNG, JPG, WEBP, PDF.</p>
                <p>Maximum size: 20MB.</p>
                <p>New uploads are published automatically and older menus stay available in the library.</p>
              </div>
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
