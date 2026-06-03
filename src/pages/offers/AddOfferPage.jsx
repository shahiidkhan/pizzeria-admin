// src/pages/offers/AddOfferPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { offerService } from '../../services/offerService';
import { formatCurrency } from '../../utils/formatCurrency';
import { offerSchema } from '../../validations/offerSchema';

export default function AddOfferPage() {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(offerSchema),
  });

  const selectedProductId = watch('productId');
  const selectedProduct   = products.find(p => p.id === selectedProductId);

  const onSubmit = async (v) => {
    setSubmitError('');
    try {
      const discountPercent = selectedProduct
        ? Math.round(((selectedProduct.price - v.discountPrice) / selectedProduct.price) * 100)
        : 0;

      await offerService.add({
        productId: v.productId,
        discountPrice: parseFloat(v.discountPrice),
        discountPercent,
        expiryDate: v.expiryDate,
        status: v.status,
      });
      navigate('/offers');
    } catch (err) {
      setSubmitError(err.message ?? 'Failed to save offer.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Add Offer"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Offers', path: '/offers' },
          { label: 'Add' },
        ]}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6 space-y-5">
            <h3 className="section-title">Offer Details</h3>

            {productsLoading ? (
              <LoadingSpinner center />
            ) : (
              <FormSelect
                label="Product"
                required
                options={products.map(p => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.price)}` }))}
                {...register('productId')}
                error={errors.productId?.message}
              />
            )}

            {selectedProduct && (
              <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl text-sm text-[var(--text-muted)]">
                Original price: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(selectedProduct.price)}</span>
              </div>
            )}

            <FormInput
              label="Discounted Price (Rs.)"
              required
              type="number"
              step="1"
              placeholder="0"
              {...register('discountPrice')}
              error={errors.discountPrice?.message}
            />
            <FormInput label="Expiry Date" required type="date" {...register('expiryDate')} error={errors.expiryDate?.message} />
            <FormSelect label="Status" required options={['active', 'inactive']} {...register('status')} error={errors.status?.message} />
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <div className="card p-5 text-sm text-[var(--text-muted)] leading-relaxed">
              Set a discounted price lower than the original product price. The offer will display the savings automatically.
            </div>
            <button type="button" onClick={() => navigate('/offers')} className="btn-secondary"><X size={16} /> Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={16} /> Save Offer</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
