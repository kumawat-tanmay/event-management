'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { inventoryService } from '@/lib/services/inventory.services';
import { getCategorySchema } from '@/utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

export function CategoryForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  
  const id = params?.id as string | undefined;
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch category data if in Edit Mode
  const { data: categoryData, error, isLoading } = useSWR(
    isEditMode ? `category-${id}` : null,
    () => inventoryService.getCategoryById(id!)
  );

  useEffect(() => {
    if (categoryData) {
      setName(categoryData.name);
      setCode(categoryData.code || '');
      setDescription(categoryData.description || '');
      setStatus(categoryData.status);
    }
  }, [categoryData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = getCategorySchema(t).safeParse({
      name,
      code,
      description,
      status
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid category input';
      return toast.error(firstIssue);
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await inventoryService.updateCategory(id!, validationResult.data);
        toast.success(t('category.updateSuccess', 'Category updated successfully'));
      } else {
        await inventoryService.createCategory(validationResult.data);
        toast.success(t('category.createSuccess', 'Category created successfully'));
      }
      router.push('/inventory/categories');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('category.saveFail', 'Failed to save category'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditMode && error) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load category details.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => router.back()} 
              className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isEditMode ? t('category.editCategory') : t('category.addCategory')}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-8">
            {isEditMode ? t('category.subtitle') : t('category.subtitle')}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              {t('category.categoryName')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tents & Structures"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-semibold text-foreground">
              {t('category.code')}
            </label>
            <Input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('category.codePlace')}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-foreground">
              {t('roles.description')}
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground resize-none"
              placeholder={t('category.describePlace')}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold text-foreground">
              {t('warehouse.status')}
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground appearance-none cursor-pointer"
              disabled={isSaving}
            >
              <option value="Active">{t('warehouse.active')}</option>
              <option value="Inactive">{t('warehouse.inactive')}</option>
            </select>
          </div>

          <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              <span>{t('warehouse.cancel')}</span>
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              className="flex items-center gap-2 min-w-[120px]"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? t('category.editCategory') : t('category.saveCategory')}</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
