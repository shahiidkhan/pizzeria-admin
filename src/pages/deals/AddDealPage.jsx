// src/pages/deals/AddDealPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Check } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { dealService } from '../../services/dealService';
import { formatCurrency } from '../../utils/formatCurrency';
import { dealSchema } from '../../validations/dealSchema';

export default function AddDealPage() {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitError, setSubmitError]           = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(dealSchema),
  });

  const toggleProduct = (id) =>
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );

  const onSubmit = async (values) => {
    setSubmitError('');
    if (selectedProducts.length === 0) {
      setSubmitError('Please select at least one product for this deal.');
      return;
    }
    try {
      const selectedObjs  = products.filter(p => selectedProducts.includes(p.id));
      const originalPrice = selectedObjs.reduce((s, p) => s + (p.price ?? 0), 0);
      const discount      = originalPrice > 0
        ? Math.round(((originalPrice - values.dealPrice) / originalPrice) * 100)
        : 0;

      await dealService.add({
        ...values,
        products: selectedProducts,
        originalPrice: parseFloat(originalPrice.toFixed(2)),
        discount,
        imageUrl: selectedObjs[0]?.imageUrl ?? selectedObjs[0]?.image ?? '',
        image: selectedObjs[0]?.imageUrl ?? selectedObjs[0]?.image ?? '',
        isActive: true,
      });
      navigate('/deals');
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save deal.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Add Deal"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Deals', path: '/deals' },
          { label: 'Add' },
        ]}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 space-y-5">
              <h3 className="section-title">Deal Information</h3>
              <FormInput label="Deal Name" required placeholder="e.g. Family Feast" {...register('name')} error={errors.name?.message} />
              <FormTextarea label="Description" required placeholder="Describe what's included..." {...register('description')} error={errors.description?.message} rows={2} />
              <FormInput label="Deal Price (Rs.)" required type="number" step="1" placeholder="0" {...register('dealPrice')} error={errors.dealPrice?.message} />
              {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            </div>

            <div className="card p-6">
              <h3 className="section-title mb-4">
                Select Products{' '}
                <span className="text-[var(--text-muted)] font-normal text-sm">({selectedProducts.length} selected)</span>
              </h3>
              {productsLoading ? (
                <LoadingSpinner center />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.map(p => {
                    const sel = selectedProducts.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                          sel ? 'border-brand-500 bg-brand-500/10' : 'border-[var(--border)] hover:border-brand-500/40'
                        }`}
                      >
                        {sel && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                        <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="text-center">
                          <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">{p.name}</p>
                          <p className="text-xs text-brand-500 font-semibold mt-0.5">{formatCurrency(p.price)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="card p-5">
              <p className="text-sm text-[var(--text-muted)]">
                Select products above and set a deal price below market value to create an attractive offer.
              </p>
            </div>
            <button type="button" onClick={() => navigate('/deals')} className="btn-secondary">
              <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={16} /> Save Deal</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
