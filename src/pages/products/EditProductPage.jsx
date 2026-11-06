// src/pages/products/EditProductPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import FormToggle from '../../components/forms/FormToggle';
import ImageUpload from '../../components/forms/ImageUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { productService } from '../../services/productService';
import { storageService } from '../../services/storageService';
import { useCategories } from '../../hooks/useCategories';
import { productSchema } from '../../validations/productSchema';

export default function EditProductPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { categories } = useCategories();
  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [available, setAvailable] = useState(true);
  const [imageValue, setImageValue] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
  });

  // Fetch product on mount
  useEffect(() => {
    productService.getById(id).then(p => {
      if (p) {
        setProduct(p);
        setAvailable(p.isAvailable ?? p.availability ?? true);
        setImageValue(p.imageUrl ?? p.image ?? '');
        const categoryId = p.categoryId || categories.find(c => c.name === p.category)?.id || '';
        reset({
          name:        p.name,
          categoryId,
          type:        p.type,
          price:       p.price,
          ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : p.ingredients,
        });
      }
      setLoading(false);
    });
  }, [id, reset, categories]);

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      const category = categories.find(c => c.id === values.categoryId);
      const imageUrl = imageValue instanceof File
        ? await storageService.uploadImage(imageValue, 'products', setUploadProgress)
        : imageValue;
      await productService.update(id, {
        ...values,
        category: category?.name || product.category || '',
        ingredients: values.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        availability: available,
        isAvailable: available,
        imageUrl,
        image: imageUrl,
      });
      navigate('/products');
    } catch (err) {
      const message = err.message ?? 'Failed to update product.';
      console.error('Product update failed:', err?.code, err?.message, err);
      setSubmitError(message);
      alert(`Upload failed: ${message}`);
    }
  };

  if (loading) return <LoadingSpinner center message="Loading product..." />;
  if (!product) return <p className="text-[var(--text-muted)] p-6">Product not found.</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Edit Product"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Products', path: '/products' },
          { label: product.name },
        ]}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 space-y-5">
              <h3 className="section-title">Product Information</h3>
              <FormInput label="Product Name" required {...register('name')} error={errors.name?.message} />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Category"
                  required
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  {...register('categoryId')}
                  error={errors.categoryId?.message}
                />
                <FormSelect label="Type" required options={['Veg', 'Non-Veg']} {...register('type')} error={errors.type?.message} />
              </div>
              <FormInput label="Price (Rs.)" required type="number" step="1" {...register('price')} error={errors.price?.message} />
              <FormTextarea label="Ingredients" required {...register('ingredients')} error={errors.ingredients?.message} rows={3} />
              {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            </div>
          </div>
          <div className="space-y-5">
            <div className="card p-6">
              <h3 className="section-title mb-4">Product Image</h3>
              <ImageUpload value={typeof imageValue === 'string' ? imageValue : ''} onChange={file => setImageValue(file || '')} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">{uploadProgress}% uploaded</p>
              )}
            </div>
            <div className="card p-6">
              <h3 className="section-title mb-4">Availability</h3>
              <FormToggle label="Available for order" description="Toggle to show/hide from menu" checked={available} onChange={setAvailable} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/products')} className="btn-secondary flex-1"><X size={16} /> Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={16} /> Update</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
