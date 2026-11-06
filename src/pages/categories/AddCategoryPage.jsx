// src/pages/categories/AddCategoryPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/forms/FormInput';
import FormTextarea from '../../components/forms/FormTextarea';
import ImageUpload from '../../components/forms/ImageUpload';
import { categoryService } from '../../services/categoryService';
import { storageService } from '../../services/storageService';
import { categorySchema } from '../../validations/categorySchema';

export default function AddCategoryPage() {
  const navigate = useNavigate();
  const [imageFile, setImageFile]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      const imageUrl = imageFile
        ? await storageService.uploadImage(imageFile, 'categories', setUploadProgress)
        : '';
      await categoryService.add({
        ...values,
        imageUrl:   imageUrl || '',
        image:      imageUrl || '',
        isActive:  true,
        itemCount: 0,
      });
      navigate('/categories');
    } catch (err) {
      const message = err.message ?? 'Failed to save category.';
      console.error('Category save failed:', err?.code, err?.message, err);
      setSubmitError(message);
      alert(`Upload failed: ${message}`);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Add Category"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Categories', path: '/categories' },
          { label: 'Add' },
        ]}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6 space-y-5">
            <h3 className="section-title">Category Details</h3>
            <FormInput label="Category Name" required placeholder="e.g. Pizza" {...register('name')} error={errors.name?.message} />
            <FormInput label="Slug" required placeholder="e.g. pizza" {...register('slug')} error={errors.slug?.message} />
            <FormTextarea label="Description" required placeholder="Brief description..." {...register('description')} error={errors.description?.message} rows={3} />
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
          </div>
          <div className="space-y-5">
            <div className="card p-6">
              <h3 className="section-title mb-4">Category Image</h3>
              <ImageUpload onChange={file => setImageFile(file)} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">{uploadProgress}% uploaded</p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/categories')} className="btn-secondary flex-1"><X size={16} /> Cancel</button>
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
