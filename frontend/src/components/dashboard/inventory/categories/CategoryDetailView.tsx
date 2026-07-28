'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Package, Layers, Calendar, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';

export function CategoryDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  
  const id = params?.id as string;

  const { data: categoryData, error, isLoading } = useSWR(
    id ? `category-detail-${id}` : null,
    () => inventoryService.getCategoryById(id)
  );

  const itemColumns = [
    { 
      header: t('item.itemId', 'Item ID'), 
      accessorKey: 'code', 
      cell: (row: Item) => <span className="font-mono text-xs uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{row.code}</span> 
    },
    { 
      header: t('item.itemName', 'Item Name'), 
      accessorKey: 'name', 
      cell: (row: Item) => <span className="font-medium text-primary">{row.name}</span> 
    },
    { 
      header: t('item.totalQty', 'Total Qty'), 
      accessorKey: 'totalStock', 
      cell: (row: Item) => <span className="font-semibold">{row.totalStock} {row.unit}</span> 
    },
    { 
      header: t('warehouse.status', 'Status'), 
      accessorKey: 'isActive', 
      cell: (row: Item) => <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} /> 
    },
    {
      header: t('roles.actions', 'Actions'),
      accessorKey: '_id',
      cell: (row: Item) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/inventory/items/${row._id}`)}
        >
          {t('category.details', 'View')}
        </Button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load category details.')}
      </div>
    );
  }

  const items = categoryData.items || [];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              {categoryData.name}
              <StatusBadge status={categoryData.status} className="mt-1" />
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-10 max-w-2xl">
            {categoryData.description || t('category.noDescription', 'No description provided.')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/inventory/categories/${categoryData._id}/edit`)}
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('category.editCategory')}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatsCard
          title={t('category.totalItems')}
          value={items.length}
          icon={Package}
          subtitle="In this category"
          colorTheme="primary"
        />
        <StatsCard
          title={t('category.totalItemsLinked')}
          value={items.reduce((acc, curr) => acc + (curr.totalStock || 0), 0)}
          icon={Layers}
          subtitle="Total stock quantity"
          colorTheme="blue"
        />
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t('warehouse.created')}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {new Date(categoryData.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Info className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t('category.lastUpdated')}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {new Date(categoryData.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Items List Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">
            {t('category.itemsIn', 'Items in {{name}}', { name: categoryData.name })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('category.itemsInSub')}</p>
        </div>
        
        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {t('category.noItems', 'No items found in this category.')}
            </div>
          ) : (
            <DataTable
              data={items}
              columns={itemColumns}
            />
          )}
        </div>
      </div>
    </div>
  );
}
