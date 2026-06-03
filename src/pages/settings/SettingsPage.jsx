// src/pages/settings/SettingsPage.jsx
import { useEffect, useState } from 'react';
import { Save, Sliders } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils/cn';
import { settingsSchema } from '../../validations/settingsSchema';

const TABS = [{ id: 'preferences', label: 'Preferences', icon: Sliders }];

function PreferencesTab() {
  const { settings, loading, saving, error, success, saveSettings } = useSettings();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
  });
  const [activeTab] = useState('preferences');

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  if (loading) return <LoadingSpinner center message="Loading settings..." />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <div className="lg:col-span-1">
        <div className="card p-2 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit(saveSettings)} className="card p-6 space-y-5">
          <h3 className="section-title">Restaurant Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Restaurant Name" {...register('restaurantName')} error={errors.restaurantName?.message} />
            <FormInput label="Contact Email" type="email" {...register('contactEmail')} error={errors.contactEmail?.message} />
            <FormInput label="Contact Phone" {...register('contactPhone')} error={errors.contactPhone?.message} />
            <FormSelect label="Branch Status" options={['open', 'closed', 'busy']} {...register('branchStatus')} error={errors.branchStatus?.message} />
            <FormInput label="Delivery Fee (Rs.)" type="number" step="1" {...register('deliveryFee')} error={errors.deliveryFee?.message} />
            <FormSelect label="Currency" options={['PKR']} {...register('currency')} error={errors.currency?.message} />
            <FormInput label="Tax Percentage" type="number" step="0.01" {...register('taxPercentage')} error={errors.taxPercentage?.message} />
            <FormInput label="Opening Time" type="time" {...register('openingTime')} error={errors.openingTime?.message} />
            <FormInput label="Closing Time" type="time" {...register('closingTime')} error={errors.closingTime?.message} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }]} />
      <PreferencesTab />
    </div>
  );
}
