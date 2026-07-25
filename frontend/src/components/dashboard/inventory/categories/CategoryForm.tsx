'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function CategoryForm() {
  const router = useRouter();
  const params = useParams();
  
  // If we have an ID, we are in edit mode
  const isEditMode = !!params?.id;
  
  const [formData, setFormData] = useState({
    name: isEditMode ? 'Tents & Structures' : '', // Mock default for edit mode
    description: isEditMode ? 'Large tents, marquees, and structural frames' : '',
    status: isEditMode ? 'Active' : 'Active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    console.log('Saving category...', formData);
    router.push('/inventory/categories');
  };

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
              {isEditMode ? 'Edit Category' : 'Add New Category'}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-8">
            {isEditMode ? 'Update existing category details' : 'Create a new inventory classification'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground"
              placeholder="e.g. Tents & Structures"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-foreground">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground resize-none"
              placeholder="Describe the items in this category..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold text-foreground">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground appearance-none cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? 'Update Category' : 'Save Category'}</span>
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
