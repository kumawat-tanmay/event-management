'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus, Download, Box, Eye, Edit, Tag, Layers, AlertCircle, Trash2, Search, Loader2, X, Save } from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { cn } from '@/utils/cn';
import { inventoryService, Item, Category } from '@/lib/services/inventory.services';
import { AdjustStockModal } from './AdjustStockModal';
import { getCategorySchema } from '@/utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function ItemsView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL ITEMS');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [adjustStockItem, setAdjustStockItem] = useState<Item | null>(null);

  // Categories Drawer State
  const [isCategoriesDrawerOpen, setIsCategoriesDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catStatus, setCatStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Fetch Items
  const { data: itemsResponse, error: itemsError, isLoading: itemsLoading, mutate } = useSWR('items-list', () => 
    inventoryService.getItems({ limit: 100 })
  );

  // Fetch Categories for Tabs and Drawer
  const { data: categories, isLoading: categoriesLoading, mutate: mutateCategories } = useSWR<Category[]>('categories', inventoryService.getCategories);

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
    
    const categoryId = typeof item.category === 'object' && item.category !== null 
      ? (item.category as any)._id 
      : '';

    const matchesCategory = selectedCategory === 'ALL' || categoryId === selectedCategory;

    let matchesTab = true;
    if (activeTab === 'AVAILABLE') {
      matchesTab = item.isActive && (item.totalStock > item.minStockAlert || item.minStockAlert === 0);
    } else if (activeTab === 'LOW STOCK ALERT') {
      matchesTab = item.totalStock <= item.minStockAlert && item.minStockAlert > 0;
    } else if (activeTab === 'INACTIVE') {
      matchesTab = !item.isActive;
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Aggregated KPIs
  const totalItemsCount = items.length;
  const totalAvailableStock = items.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
  const totalReservedStock = items.reduce((acc, curr) => acc + (curr.reservedStock || 0), 0);
  const totalDamagedStock = items.reduce((acc, curr) => acc + (curr.damagedStock || 0), 0);

  // ─── Category Drawer Actions ────────────────────────────────────────────────
  const handleOpenDrawer = () => {
    resetCategoryForm();
    setIsCategoriesDrawerOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatCode('');
    setCatDescription('');
    setCatStatus('Active');
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code || '');
    setCatDescription(cat.description || '');
    setCatStatus(cat.status);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: catName,
      code: catCode || undefined,
      description: catDescription,
      status: catStatus
    };

    const validationResult = getCategorySchema(t).safeParse(payload);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid category input';
      return toast.error(firstIssue);
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await inventoryService.updateCategory(editingCategory._id, validationResult.data);
        toast.success(t('category.updateSuccess', 'Category updated successfully'));
      } else {
        await inventoryService.createCategory(validationResult.data);
        toast.success(t('category.createSuccess', 'Category created successfully'));
      }
      resetCategoryForm();
      mutateCategories();
      mutate(); // Update category tabs
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('category.saveFail', 'Failed to save category'));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (isDeletingCategory) return;
    setIsDeletingCategory(true);
    try {
      await inventoryService.deleteCategory(catId);
      toast.success(t('category.deleteSuccess', 'Category deleted successfully'));
      if (editingCategory?._id === catId) {
        resetCategoryForm();
      }
      mutateCategories();
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('category.deleteFail', 'Failed to delete category'));
    } finally {
      setIsDeletingCategory(false);
    }
  };

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
      header: t('item.category', 'Category'), 
      accessorKey: 'category', 
      cell: (row: Item) => {
        const catName = typeof row.category === 'object' && row.category !== null 
          ? (row.category as any).name 
          : '—';
        return <span className="font-semibold text-muted-foreground">{catName}</span>;
      }
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
      header: t('item.reserved', 'Reserved'), 
      accessorKey: 'reservedStock', 
      cell: (row: Item) => <span className="font-bold text-blue-600">{row.reservedStock}</span> 
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
        <div className="flex items-center justify-end gap-2">
          <Link href={`/inventory/items/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={t('category.details')}>
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/inventory/items/${row._id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={t('item.editItem')}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            title="Adjust Stock"
            onClick={() => setAdjustStockItem(row)}
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title={t('item.deleteItem')}
            onClick={() => handleDeleteClick(row._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  ];

  if (itemsLoading || categoriesLoading) {
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
          <Button 
            variant="outline" 
            onClick={handleOpenDrawer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted font-bold transition-all"
          >
            <Layers className="w-4 h-4 shrink-0 text-primary" />
            <span>{t('category.title')}</span>
          </Button>
          <Link href="/inventory/items/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2 font-bold shadow-md hover:shadow-lg">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('item.addItem')}</span>
            </Button>
          </Link>
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
          title={t('item.reservedLocked')}
          value={totalReservedStock}
          icon={Tag}
          subtitle="Active"
          colorTheme="blue"
        />
        <StatsCard
          title={t('item.damagedMissing')}
          value={totalDamagedStock}
          icon={AlertCircle}
          subtitle="Warning"
          colorTheme="error"
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
                <div className="relative w-full sm:w-44">
                  <select
                    className="w-full h-10 pl-3 pr-8 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    {categories?.filter(c => c.status === 'Active').map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
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

      {/* ─── Simplified Slide-Over Categories Drawer ────────────────────────── */}
      {isCategoriesDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCategoriesDrawerOpen(false)} 
          />
          
          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full transform transition-all duration-300">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    {editingCategory ? t('category.editCategory') : t('category.title')}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsCategoriesDrawerOpen(false)} 
                  className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Add/Edit Inline Form */}
                <form onSubmit={handleSaveCategory} className="bg-zinc-50 dark:bg-zinc-900/30 border border-border p-4 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {editingCategory ? t('category.editCategory') : t('category.addCategory')}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">{t('category.categoryName')} *</label>
                    <Input 
                      type="text" 
                      value={catName} 
                      onChange={(e) => setCatName(e.target.value)} 
                      placeholder="e.g. Furniture, Lighting" 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">{t('category.code')}</label>
                    <Input 
                      type="text" 
                      value={catCode} 
                      onChange={(e) => setCatCode(e.target.value)} 
                      placeholder="e.g. FUR, LGT" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">{t('roles.description')}</label>
                    <textarea 
                      rows={2} 
                      value={catDescription} 
                      onChange={(e) => setCatDescription(e.target.value)} 
                      placeholder={t('category.describePlace')} 
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">{t('warehouse.status')}</label>
                    <select 
                      value={catStatus} 
                      onChange={(e) => setCatStatus(e.target.value as 'Active' | 'Inactive')} 
                      className="w-full h-10 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
                    >
                      <option value="Active">{t('warehouse.active')}</option>
                      <option value="Inactive">{t('warehouse.inactive')}</option>
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {editingCategory && (
                      <Button type="button" variant="outline" size="sm" onClick={resetCategoryForm}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1.5 min-w-[80px]" disabled={isSavingCategory}>
                      {isSavingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>{editingCategory ? t('roles.actions', 'Save') : t('category.addCategory')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Categories List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t('category.listTitle')}</h3>
                  
                  {(!categories || categories.length === 0) ? (
                    <div className="text-center py-6 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                      No categories found.
                    </div>
                  ) : (
                    <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
                      {categories.map(cat => (
                        <div key={cat._id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="space-y-1 max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{cat.name}</span>
                              <span className="text-[10px] font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-muted-foreground">
                                {cat.code}
                              </span>
                            </div>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                              <span>{cat.itemsCount || 0} items</span>
                              <span>•</span>
                              <StatusBadge status={cat.status} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditCategory(cat)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDeleteCategory(cat._id)}
                              disabled={isDeletingCategory}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      <AdjustStockModal 
        isOpen={!!adjustStockItem}
        onClose={() => setAdjustStockItem(null)}
        item={adjustStockItem}
        onSuccess={() => {
          mutate();
        }}
      />
    </div>
  );
}
