// src/pages/branches/BranchesPage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Phone, Plus, Save, Trash2, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormToggle from '../../components/forms/FormToggle';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useBranches } from '../../hooks/useBranches';
import { branchSchema } from '../../validations/branchSchema';

export default function BranchesPage() {
  const { branches, loading, error, addBranch, toggleStatus, removeBranch } = useBranches();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: { location: '', status: 'open', contact: '' },
  });

  const openCount = branches.filter(b => (b.status ? b.status === 'open' : !!b.isOpen)).length;

  const closeModal = () => {
    setModalOpen(false);
    setSubmitError('');
    reset({ location: '', status: 'open', contact: '' });
  };

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      await addBranch(values);
      closeModal();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create branch.');
    }
  };

  const handleToggle = async (id, val) => {
    try {
      await toggleStatus(id, val);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await removeBranch(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete branch.');
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <p className="text-red-400 p-6">Error loading branches: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Branches"
        subtitle={loading ? 'Loading...' : `${openCount} of ${branches.length} branches open`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Branches' }]}
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Branch
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner center message="Loading branches..." />
      ) : branches.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-12">No branches configured yet.</p>
      ) : (
        <>
        {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branches.map(branch => {
            const isOpen = branch.status ? branch.status === 'open' : !!branch.isOpen;
            const location = branch.location || branch.name || 'Branch';
            const contact = branch.contact || branch.phone || '';

            return (
              <div key={branch.id} className="card p-5 hover:shadow-card-md transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isOpen ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                    }`}>
                      <MapPin size={22} className={isOpen ? 'text-emerald-500' : 'text-slate-500'} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{location}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${
                          isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          isOpen ? 'text-emerald-500' : 'text-slate-500'
                        }`}>
                          {isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTarget({ id: branch.id, location });
                      }}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all"
                      aria-label={`Delete ${location}`}
                      title="Delete branch"
                    >
                      <Trash2 size={16} />
                    </button>
                    <FormToggle checked={isOpen} onChange={v => handleToggle(branch.id, v)} />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <MapPin size={14} className="shrink-0 mt-0.5" />
                    <span className="text-xs">{location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Phone size={14} />
                    <span className="text-xs">{contact || 'No contact saved'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-md p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Add Branch</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]">
                <X size={16} />
              </button>
            </div>

            <FormInput label="Location" required {...register('location')} error={errors.location?.message} />
            <FormInput label="Contact" required {...register('contact')} error={errors.contact?.message} />
            <FormSelect
              label="Status"
              required
              options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
              {...register('status')}
              error={errors.status?.message}
            />

            {submitError && <p className="text-sm text-red-400">{submitError}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={16} /> Save</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Branch"
        message={`Are you sure you want to delete ${deleteTarget?.location || 'this branch'}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
        }}
        loading={deleting}
      />
    </div>
  );
}
