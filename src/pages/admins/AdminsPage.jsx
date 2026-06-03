// src/pages/admins/AdminsPage.jsx
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import { MapPin, Plus, Save, Shield, X } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import { useAdmins } from '../../hooks/useAdmins';
import { useBranches } from '../../hooks/useBranches';
import { adminSchema } from '../../validations/adminSchema';

const columnHelper = createColumnHelper();

export default function AdminsPage() {
  const { admins, loading, error, addAdmin } = useAdmins();
  const { branches } = useBranches();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: '', email: '', password: '', branchId: '', image: '', role: 'Branch Manager' },
  });

  const branchOptions = useMemo(
    () => branches.map(branch => ({ value: branch.id, label: branch.location || branch.name || branch.id })),
    [branches],
  );

  const tableData = useMemo(
    () => admins.map(admin => ({
      ...admin,
      branchName: admin.branchId
        ? branches.find(branch => branch.id === admin.branchId)?.location
          || branches.find(branch => branch.id === admin.branchId)?.name
          || admin.branchId
        : 'All Branches',
    })),
    [admins, branches],
  );

  const closeModal = () => {
    setModalOpen(false);
    setSubmitError('');
    reset({ name: '', email: '', password: '', branchId: '', image: '', role: 'Branch Manager' });
  };

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      await addAdmin(values);
      closeModal();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create admin.');
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Admin',
      cell: info => (
        <div className="flex items-center gap-3">
          {info.row.original.image || info.row.original.avatar ? (
            <img
              src={info.row.original.image || info.row.original.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover border-2 border-[var(--border)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold border-2 border-[var(--border)]">
              {info.getValue()?.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{info.getValue()}</p>
            <p className="text-xs text-[var(--text-muted)]">{info.row.original.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <div className="flex items-center gap-1.5">
          <Shield size={13} className="text-[var(--text-muted)]" />
          <StatusBadge status={info.getValue()} />
        </div>
      ),
    }),
    columnHelper.accessor('branchName', {
      header: 'Branch',
      cell: info => (
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <MapPin size={13} />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue() ? 'active' : 'inactive'} />,
    }),
    columnHelper.accessor('lastLogin', {
      header: 'Last Login',
      cell: info => {
        const raw = info.getValue();
        if (!raw) return <span className="text-xs text-[var(--text-muted)]">Never</span>;
        const date = raw?.toDate ? raw.toDate() : new Date(raw);
        return <span className="text-xs text-[var(--text-muted)]">{Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()}</span>;
      },
    }),
  ], []);

  const superAdmins = admins.filter(a => a.role === 'Super Admin').length;
  const branchManagers = admins.filter(a => a.role === 'Branch Manager').length;

  if (error) return <p className="text-red-400 p-6">Error loading admins: {error}</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Admin Users"
        subtitle={`${admins.length} admin accounts`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Admin Users' }]}
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Admin
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Admins', value: admins.length, color: 'bg-purple-500/10 text-purple-500' },
          { label: 'Super Admins', value: superAdmins, color: 'bg-brand-500/10 text-brand-500' },
          { label: 'Branch Managers', value: branchManagers, color: 'bg-blue-500/10 text-blue-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <Shield size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{loading ? '-' : s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading
        ? <LoadingSpinner center message="Loading admins..." />
        : <DataTable columns={columns} data={tableData} />}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-lg p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Add Admin</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Name" required {...register('name')} error={errors.name?.message} />
              <FormInput label="Email" required type="email" {...register('email')} error={errors.email?.message} />
            </div>
            <FormInput label="Password" required type="password" {...register('password')} error={errors.password?.message} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Role"
                required
                options={['Super Admin', 'Branch Manager']}
                {...register('role')}
                error={errors.role?.message}
              />
              <FormSelect
                label="Branch"
                placeholder="All Branches"
                options={branchOptions}
                {...register('branchId')}
                error={errors.branchId?.message}
              />
            </div>
            <FormInput label="Image URL" {...register('image')} error={errors.image?.message} />

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
    </div>
  );
}
