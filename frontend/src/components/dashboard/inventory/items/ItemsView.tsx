'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus, Box, Eye, Edit, Layers, AlertCircle, Trash2, Search, Loader2, Truck } from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';

import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { cn } from '@/utils/cn';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function ItemsView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL ITEMS');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ponytail: removed unnecessary warehouse fetch and zoneId mapping for item category

  // Fetch Items
  const { data: itemsResponse, error: itemsError, isLoading: itemsLoading, mutate } = useSWR('items-list', () => 
    inventoryService.getItems({ limit: 100 })
  );

  const items = itemsResponse?.data || [];

  // Generate status tabs dynamically
  const dynamicTabs = ['ALL ITEMS', 'AVAILABLE', 'LOW STOCK ALERT', 'INACTIVE'];

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await inventoryService.deleteItem(itemToDelete);
      toast.success(t('item.deleteSuccess', 'Item deleted successfully'));
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('item.deleteFail', 'Failed to delete item'));
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredData = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'AVAILABLE') {
      matchesTab = item.isActive && (item.totalStock > item.minStockAlert || item.minStockAlert === 0);
    } else if (activeTab === 'LOW STOCK ALERT') {
      matchesTab = item.totalStock <= item.minStockAlert && item.minStockAlert > 0;
    } else if (activeTab === 'INACTIVE') {
      matchesTab = !item.isActive;
    }

    return matchesSearch && matchesTab;
  });

  const totalItemsCount = items.length;
  const totalAvailableStock = items.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
  const totalDamagedStock = items.reduce((acc, curr) => acc + (curr.damagedStock || 0), 0);
  const totalDispatchedStock = items.reduce((acc, curr) => acc + (curr.dispatchedStock || 0), 0);

  const columns = [
    {
      header: t('item.details', 'Item Details'),
      accessorKey: 'name',
      cell: (row: Item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <Box className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-bold text-foreground">{row.name}</div>
            <div className="text-xs font-mono text-muted-foreground">{row.code}</div>
          </div>
        </div>
      )
    },
    {
      header: t('item.available', 'Available'),
      accessorKey: 'availableStock',
      cell: (row: Item) => (
        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full text-sm font-bold">
          {row.availableStock} {row.unit}
        </span>
      )
    },
    { 
      header: t('item.damaged', 'Damaged'), 
      accessorKey: 'damagedStock', 
      cell: (row: Item) => <span className="font-bold text-error">{row.damagedStock}</span> 
    },
    { 
      header: t('item.status', 'Status'), 
      accessorKey: 'status', 
      cell: (row: Item) => {
        const isLow = row.totalStock <= row.minStockAlert && row.minStockAlert > 0;
        return <StatusBadge status={isLow ? 'Low Stock Alert' : row.isActive ? 'Available' : 'Inactive'} />;
      }
    },
    {
      header: t('roles.actions', 'Actions'), 
      accessorKey: 'actions', 
      cell: (row: Item) => (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/inventory/items/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={t('item.details')}>
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <ActionGuard permission="inventory.update">
            <Link href={`/inventory/items/${row._id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={t('item.editItem')}>
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>
          <ActionGuard permission="inventory.delete">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title={t('item.deleteItem')}
              onClick={() => handleDeleteClick(row._id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  if (itemsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (itemsError) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load items.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('item.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('item.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ActionGuard permission="inventory.create">
            <Link href="/inventory/items/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2 font-bold shadow-md hover:shadow-lg">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('item.addItem')}</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatsCard
          title={t('item.totalItemsCatalog')}
          value={totalItemsCount}
          icon={Layers}
          subtitle="Unique SKUs"
          colorTheme="primary"
        />
        <StatsCard
          title={t('item.totalAvailableStock')}
          value={totalAvailableStock}
          icon={Box}
          subtitle="Stable"
          colorTheme="success"
        />
        <StatsCard
          title={t('item.damagedMissing')}
          value={totalDamagedStock}
          icon={AlertCircle}
          subtitle="Warning"
          colorTheme="error"
        />
        <StatsCard
          title={t('item.dispatchedStock', 'Dispatched Stock')}
          value={totalDispatchedStock}
          icon={Truck}
          subtitle="On Site"
          colorTheme="blue"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder={t('item.searchPlace')}
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 w-full">
              {/* Title */}
              <div className="flex items-center gap-2 shrink-0">
                <Box className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{t('item.itemCatalog')}</h3>
              </div>

              {/* Status Tabs */}
              <div className="flex w-full xl:w-auto overflow-x-auto pb-2 -mb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-max">
                  {dynamicTabs.map((tab) => (
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
                      {tab === 'ALL ITEMS' ? t('item.all', 'ALL ITEMS') : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('item.searchPlace', 'Search items...')}
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          }
          className="border-none shadow-none"
        />
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('item.deleteItem')}
        message={t('item.deleteConfirmMsg')}
        confirmText={t('item.deleteItem')}
      />

    </div>
  );
}
