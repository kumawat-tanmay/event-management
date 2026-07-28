'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus, Tag, Search, Eye, Edit, Layers, Trash2, CheckCircle, Package, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { inventoryService, Category } from '@/lib/services/inventory.services';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function CategoriesView() {
  const { t } = useTranslation();
  const { data: categories, error, isLoading, mutate } = useSWR<Category[]>('categories', inventoryService.getCategories);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL CATEGORIES');
  const tabs = ['ALL CATEGORIES', 'ACTIVE', 'INACTIVE'];
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await inventoryService.deleteCategory(categoryToDelete);
      toast.success(t('category.deleteSuccess', 'Category deleted successfully'));
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('category.deleteFail', 'Failed to delete category'));
    } finally {
      setCategoryToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const filteredData = (categories || []).filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL CATEGORIES' || 
                       (activeTab === 'ACTIVE' && cat.status === 'Active') || 
                       (activeTab === 'INACTIVE' && cat.status === 'Inactive');
    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: t('category.categoryName', 'Category Name'), 
      accessorKey: 'name', 
      cell: (row: Category) => <span className="font-semibold text-primary">{row.name}</span> 
    },
    { 
      header: t('category.code', 'Category Code'), 
      accessorKey: 'code', 
      cell: (row: Category) => <span className="font-mono text-xs uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{row.code || 'N/A'}</span> 
    },
    { 
      header: t('roles.description', 'Description'), 
      accessorKey: 'description', 
      cell: (row: Category) => <span className="text-muted-foreground truncate max-w-[250px] block">{row.description || '—'}</span> 
    },
    { 
      header: t('category.totalItems', 'Total Items'), 
      accessorKey: 'itemsCount', 
      cell: (row: Category) => <span className="font-medium">{row.itemsCount || 0}</span> 
    },
    { 
      header: t('warehouse.status', 'Status'), 
      accessorKey: 'status', 
      cell: (row: Category) => <StatusBadge status={row.status} /> 
    },
    { 
      header: t('roles.actions', 'Actions'), 
      accessorKey: 'actions', 
      cell: (row: Category) => (
        <div className="flex items-center gap-2">
          <Link href={`/inventory/categories/${row._id}`}>
            <Button variant="outline" className="h-8 w-8 p-0" title={t('category.details', 'View Details')}>
              <Eye className="w-4 h-4 text-blue-500" />
            </Button>
          </Link>
          <Link href={`/inventory/categories/${row._id}/edit`}>
            <Button variant="outline" className="h-8 w-8 p-0" title={t('category.editCategory', 'Edit Category')}>
              <Edit className="w-4 h-4 text-yellow-500" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500/30" 
            title={t('category.deleteCategory', 'Delete Category')}
            onClick={() => handleDeleteClick(row._id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ) 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load categories.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t('category.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">{t('category.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/inventory/categories/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('category.addCategory')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('category.totalCategories')}
          value={(categories || []).length}
          icon={Layers}
          subtitle="+1 New"
          colorTheme="primary"
        />
        <StatsCard
          title={t('category.activeCategories')}
          value={(categories || []).filter(d => d.status === 'Active').length}
          icon={CheckCircle}
          subtitle="All Good"
          colorTheme="success"
        />
        <StatsCard
          title={t('category.totalItemsLinked')}
          value={(categories || []).reduce((acc, curr) => acc + (curr.itemsCount || 0), 0)}
          icon={Package}
          subtitle="Overall Stock"
          colorTheme="blue"
        />
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{t('category.listTitle')}</h3>
              </div>
              
              <div className="flex items-center justify-center w-full lg:w-1/3">
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit overflow-x-auto max-w-[calc(100vw-2rem)] no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                        activeTab === tab
                          ? "bg-primary text-on-primary shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                      )}
                    >
                      {tab === 'ALL CATEGORIES' ? t('category.allCategories') : tab === 'ACTIVE' ? t('warehouse.active') : t('warehouse.inactive')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full lg:w-1/3 flex justify-end">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder={t('category.searchPlace')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
              </div>
            </div>
          }
          className="border-none shadow-none"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('category.deleteCategory')}
        message={t('category.deleteConfirmMsg')}
        confirmText={t('category.deleteCategory')}
      />
    </div>
  );
}
