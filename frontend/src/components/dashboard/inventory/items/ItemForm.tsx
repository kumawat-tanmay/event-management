'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Save, Box, IndianRupee, Settings, Loader2, Plus, Warehouse as WarehouseIcon, Layers, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { inventoryService, Item, Category } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { getItemSchema, getCategorySchema } from '@/utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface ItemFormProps {
  isEditing?: boolean;
}

export function ItemForm({ isEditing = false }: ItemFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  
  const id = params?.id as string | undefined;

  // Item Form Fields State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Pieces');
  const [rentalPrice, setRentalPrice] = useState<number>(0);
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Quick Category Add modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickCatCode, setQuickCatCode] = useState('');
  const [quickCatDesc, setQuickCatDesc] = useState('');
  const [isCreatingQuickCat, setIsCreatingQuickCat] = useState(false);

  // Warehouse Opening Stock State (only for Create Mode)
  type StockEntry = { quantity: number; zoneId?: string; rackId?: string };
  const [openingQuantities, setOpeningQuantities] = useState<Record<string, StockEntry>>({});

  // Fetch Categories
  const { data: categories, isLoading: categoriesLoading, mutate: mutateCategories } = useSWR<Category[]>('categories', inventoryService.getCategories);
  const activeCategories = (categories || []).filter(c => c.status === 'Active');

  // Fetch Warehouses for opening stock list
  const { data: warehouses, isLoading: warehousesLoading } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);
  const activeWarehouses = (warehouses || []).filter(w => w.isActive);

  // Fetch item details if editing
  const { data: itemData, isLoading: itemLoading } = useSWR(
    isEditing && id ? `item-${id}` : null,
    () => inventoryService.getItemById(id!)
  );

  useEffect(() => {
    if (itemData) {
      setName(itemData.name);
      setCode(itemData.code);
      setCategory(typeof itemData.category === 'object' ? (itemData.category as any)._id : itemData.category);
      setDescription(itemData.description || '');
      setUnit(itemData.unit);
      setRentalPrice(itemData.rentalPrice);
      setPurchaseCost(itemData.purchaseCost);
      setMinStockAlert(itemData.minStockAlert);
      setIsActive(itemData.isActive);
      setImage(itemData.image || '');
    }
  }, [itemData]);

  // Handle Quick Category Creation
  const handleCreateQuickCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: quickCatName,
      code: quickCatCode || undefined,
      description: quickCatDesc,
      status: 'Active' as const
    };

    const validationResult = getCategorySchema(t).safeParse(payload);
    if (!validationResult.success) {
      return toast.error(validationResult.error.issues[0]?.message || 'Invalid category input');
    }

    setIsCreatingQuickCat(true);
    try {
      const newCat = await inventoryService.createCategory(validationResult.data);
      toast.success(t('category.createSuccess', 'Category created successfully'));
      mutateCategories();
      setCategory(newCat._id);
      setIsCategoryModalOpen(false);
      setQuickCatName('');
      setQuickCatCode('');
      setQuickCatDesc('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('category.saveFail', 'Failed to save category'));
    } finally {
      setIsCreatingQuickCat(false);
    }
  };

  const handleQtyChange = (whId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setOpeningQuantities(prev => ({ 
      ...prev, 
      [whId]: { ...prev[whId], quantity: num } 
    }));
  };

  const handleLocationChange = (whId: string, field: 'zoneId' | 'rackId', val: any) => {
    setOpeningQuantities(prev => ({
      ...prev,
      [whId]: { ...prev[whId], [field]: val, quantity: prev[whId]?.quantity || 0 }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      code: code || undefined,
      category,
      description,
      unit,
      rentalPrice: Number(rentalPrice),
      purchaseCost: Number(purchaseCost),
      minStockAlert: Number(minStockAlert),
      isActive,
      image
    };

    const validationResult = getItemSchema(t).safeParse(payload);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid item data';
      return toast.error(firstIssue);
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await inventoryService.updateItem(id!, payload);
        toast.success(t('item.updateSuccess', 'Item updated successfully'));
        router.push('/inventory/items');
      } else {
        // Step 1: Create Item
        const newItem = await inventoryService.createItem(payload);
        
        // Step 2: Directly submit opening stock for warehouses with quantities > 0
        const stockEntries = Object.entries(openingQuantities).filter(([_, entry]) => entry.quantity > 0);
        if (stockEntries.length > 0) {
          for (const [whId, entry] of stockEntries) {
            await inventoryService.addOpeningStock(newItem._id, whId, entry.quantity, entry.zoneId, entry.rackId);
          }
        }
        
        toast.success(t('item.createSuccess', 'Item created successfully'));
        router.push('/inventory/items');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('item.saveFail', 'Failed to save item'));
    } finally {
      setIsSaving(false);
    }
  };

  if ((isEditing && itemLoading) || categoriesLoading || warehousesLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => router.back()} 
          className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? t('item.editItem') : t('item.addItem')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? t('item.subtitle') : 'Create a new catalog item and set opening quantities.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Single-Column Card Container */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
          
          {/* Section 1: Basic Information */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
              <Box className="w-5 h-5 text-primary" />
              <h2>{t('item.basicInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.itemName')} *</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Premium Sofa Set" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.code')}</label>
                <Input 
                  type="text" 
                  placeholder={t('item.codePlace')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.category')} *</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <select 
                      className="w-full h-10 pl-3 pr-10 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-foreground"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      disabled={isSaving}
                    >
                      <option value="">{t('warehouse.selectManager')}</option>
                      {activeCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-10 px-3 border border-border rounded-xl flex items-center justify-center hover:bg-muted text-primary"
                    onClick={() => setIsCategoryModalOpen(true)}
                    title={t('category.addCategory')}
                    disabled={isSaving}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('roles.description')}</label>
                <textarea 
                  rows={3}
                  placeholder="Details about this item..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Settings */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2>{t('item.settingsPricing')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.rentalPrice')} *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={rentalPrice || ''}
                    onChange={(e) => setRentalPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.purchaseCost')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={purchaseCost || ''}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.unit')}</label>
                <div className="relative">
                  <select 
                    id="unit-options"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                    disabled={isSaving}
                  >
                    <option value="" disabled>{t('item.unitPlace', 'Select Unit')}</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Sets">Sets</option>
                    <option value="SqFt">Square Feet (SqFt)</option>
                    <option value="Meters">Meters</option>
                    <option value="Kg">Kilograms (Kg)</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.minStockAlert')}</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={minStockAlert || ''}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  disabled={isSaving}
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2 md:col-span-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{t('item.activeItem')}</p>
                  <p className="text-xs text-muted-foreground">{t('item.activeItemDesc')}</p>
                </div>
                <div 
                  onClick={() => !isSaving && setIsActive(!isActive)}
                  className={cn(
                    "w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-200",
                    isActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200",
                    isActive ? "right-1" : "left-1"
                  )}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Warehouse Opening Stock (Only on Creation Form) */}
          {!isEditing && (
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-1">
                  <WarehouseIcon className="w-5 h-5 text-primary" />
                  <h2>{t('item.warehouseOpeningStock')}</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('item.warehouseOpeningStockSub')}
                </p>
              </div>

              <div className="space-y-3">
                {activeWarehouses.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                    {t('item.noActiveWarehouses')}
                  </div>
                ) : (
                  activeWarehouses.map(wh => {
                    const entry = openingQuantities[wh._id] || { quantity: 0 };
                    const selectedZone = wh.zones?.find((z: any) => z._id === entry.zoneId);
                    return (
                      <div key={wh._id} className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                              <WarehouseIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{wh.name}</p>
                              <p className="text-xs text-muted-foreground">{wh.location || wh.address}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 max-w-xs w-full sm:w-56 shrink-0">
                            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{t('item.initialStock')}</span>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={entry.quantity || ''}
                              onChange={(e) => handleQtyChange(wh._id, e.target.value)}
                              disabled={isSaving}
                              className="text-right"
                            />
                          </div>
                        </div>

                        {/* Location Selection (Always visible if zones exist) */}
                        {wh.zones && wh.zones.length > 0 && (
                          <div className="pl-13 sm:pl-14">
                            <div className="mt-1 flex flex-col sm:flex-row gap-3 p-3 bg-background border border-border rounded-xl">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">{t('item.selectZone', 'Select Zone')}</label>
                                <select 
                                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  value={entry.zoneId || ''}
                                  onChange={(e) => {
                                    handleLocationChange(wh._id, 'zoneId', e.target.value);
                                    handleLocationChange(wh._id, 'rackId', ''); // reset rack
                                  }}
                                  disabled={isSaving}
                                >
                                  <option value="">-- {t('item.selectZone', 'Select Zone')} --</option>
                                  {wh.zones.map((z: any) => (
                                    <option key={z._id} value={z._id}>{z.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">{t('item.selectRack', 'Select Rack')}</label>
                                <select 
                                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  value={entry.rackId || ''}
                                  onChange={(e) => handleLocationChange(wh._id, 'rackId', e.target.value)}
                                  disabled={!entry.zoneId || isSaving}
                                >
                                  <option value="">-- {t('item.selectRack', 'Select Rack')} --</option>
                                  {selectedZone?.racks?.map((r: any) => (
                                    <option key={r._id} value={r._id}>{r.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            className="min-w-[140px] flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            <span>{isEditing ? t('item.editItem') : t('item.saveItem')}</span>
          </Button>
        </div>

      </form>

      {/* ─── Quick Add Category Popup Modal ───────────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {t('category.addCategory')}
              </h3>
              <button 
                type="button"
                onClick={() => setIsCategoryModalOpen(false)} 
                className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateQuickCategory} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('category.categoryName')} *</label>
                <Input 
                  type="text" 
                  value={quickCatName} 
                  onChange={(e) => setQuickCatName(e.target.value)} 
                  placeholder="e.g. Chairs, Lighting" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('category.code')}</label>
                <Input 
                  type="text" 
                  value={quickCatCode} 
                  onChange={(e) => setQuickCatCode(e.target.value)} 
                  placeholder="e.g. CHR, LGT" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('roles.description')}</label>
                <textarea 
                  rows={3} 
                  value={quickCatDesc} 
                  onChange={(e) => setQuickCatDesc(e.target.value)} 
                  placeholder={t('category.describePlace')} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={isCreatingQuickCat}
                >
                  {t('warehouse.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="min-w-[100px]"
                  disabled={isCreatingQuickCat}
                >
                  {isCreatingQuickCat ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('category.addCategory')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
