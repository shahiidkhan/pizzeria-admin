// src/pages/products/AddProductPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import FormToggle from '../../components/forms/FormToggle';
import ImageUpload from '../../components/forms/ImageUpload';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { storageService } from '../../services/storageService';
import { productSchema } from '../../validations/productSchema';

export default function AddProductPage() {
  const navigate = useNavigate();
  const { addProduct } = useProducts();
  const { categories } = useCategories();
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      const category = categories.find(c => c.id === values.categoryId);
      const imageUrl = imageFile
        ? await storageService.uploadImage(imageFile, 'products', setUploadProgress)
        : '';
      await addProduct({
        ...values,
        category: category?.name || '',
        ingredients: values.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        availability: available,
        isAvailable: available,
        imageUrl: imageUrl || '',
        image: imageUrl || '',
        rating: 0,
      });
      navigate('/products');
    } catch (err) {
      const message = err.message ?? 'Failed to save product.';
      console.error('Product save failed:', err?.code, err?.message, err);
      setSubmitError(message);
      alert(`Upload failed: ${message}`);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Add Product"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Products', path: '/products' },
          { label: 'Add Product' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Fields */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 space-y-5">
              <h3 className="section-title">Product Information</h3>
              <FormInput label="Product Name" required placeholder="e.g. Pepperoni Feast" {...register('name')} error={errors.name?.message} />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Category" required
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  {...register('categoryId')}
                  error={errors.categoryId?.message}
                />
                <FormSelect
                  label="Type" required
                  options={['Veg', 'Non-Veg']}
                  {...register('type')}
                  error={errors.type?.message}
                />
              </div>
              <FormInput label="Price (Rs.)" required type="number" step="1" placeholder="0" {...register('price')} error={errors.price?.message} />
              <FormTextarea
                label="Ingredients"
                required
                placeholder="Tomato Sauce, Mozzarella, Pepperoni..."
                {...register('ingredients')}
                error={errors.ingredients?.message}
                rows={3}
              />
              {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            </div>
          </div>

          {/* Sidebar Fields */}
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <h3 className="section-title">Product Image</h3>
              <ImageUpload label="Upload Image" onChange={file => setImageFile(file)} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-xs text-[var(--text-muted)]">{uploadProgress}% uploaded</p>
              )}
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="section-title">Availability</h3>
              <FormToggle
                label="Available for order"
                description="Toggle to show/hide from menu"
                checked={available}
                onChange={setAvailable}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/products')} className="btn-secondary flex-1">
                <X size={16} /> Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={16} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
