'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Save, Box, IndianRupee, Settings, Loader2, Plus, Warehouse as WarehouseIcon, Layers, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { getItemSchema } from '@/utils/validations';
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
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Pieces');
  const [rentalPrice, setRentalPrice] = useState<number>(0);
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Warehouse Opening Stock State (only for Create Mode)
  const [totalPieces, setTotalPieces] = useState<number>(0);
  type StockEntry = { quantity: number; zoneId?: string; rackId?: string };
  const [openingQuantities, setOpeningQuantities] = useState<Record<string, StockEntry>>({});

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
      setDescription(itemData.description || '');
      setUnit(itemData.unit);
      setRentalPrice(itemData.rentalPrice);
      setPurchaseCost(itemData.purchaseCost);
      setMinStockAlert(itemData.minStockAlert);
      setIsActive(itemData.isActive);
      setImage(itemData.image || '');
      setTotalPieces(itemData.totalStock || 0);
    }
  }, [itemData]);

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
      description,
      unit,
      totalStock: Number(totalPieces) || 0,
      purchaseCost: Number(purchaseCost) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      isActive
    };

    const validationResult = getItemSchema(t).safeParse(payload);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid item data';
      toast.error(firstIssue);
      return;
    }

    // Verify sum of warehouse quantities matches totalPieces (only in create mode)
    const sumOpeningQuantities = Object.values(openingQuantities).reduce((acc, entry) => acc + (entry.quantity || 0), 0);
    if (!isEditing && sumOpeningQuantities !== totalPieces) {
      toast.error(`Total Pieces (${totalPieces}) must match the sum of warehouse opening stock quantities (${sumOpeningQuantities}).`);
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing && id) {
        await inventoryService.updateItem(id, payload);
        toast.success(t('item.updateSuccess', 'Item updated successfully!'));
      } else {
        // Create the item first
        const newItem = await inventoryService.createItem(payload);
        
        // Add opening stock sequentially to prevent concurrency conflicts
        const openingStockEntries = Object.entries(openingQuantities)
          .filter(([_, data]) => data.quantity > 0);
          
        for (const [warehouseId, data] of openingStockEntries) {
          await inventoryService.addOpeningStock(
            newItem._id,
            warehouseId,
            data.quantity,
            data.zoneId,
            data.rackId
          );
        }
        
        toast.success(t('item.createSuccess', 'Item created successfully!'));
      }
      router.push('/inventory/items');
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error?.response?.data?.message || t('item.saveError', 'Failed to save item'));
    } finally {
      setIsSaving(false);
    }
  };

  if ((isEditing && itemLoading) || warehousesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
            disabled={isSaving}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isEditing ? t('item.editItemTitle', 'Edit Item') : t('item.addItemTitle', 'Add New Item')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            {t('roles.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? t('item.saving', 'Saving...') : (isEditing ? t('item.updateItem', 'Update Item') : t('item.saveItem', 'Save Item'))}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
              <Box className="w-5 h-5 text-primary" />
              <h2>{t('item.basicInfo', 'Basic Information')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <Input
                  label={`${t('item.itemName', 'Item Name')} *`}
                  placeholder="e.g. Premium Sofa Set"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Input
                  label={t('item.codeOptional', 'SKU CODE (OPTIONAL)')}
                  placeholder={t('item.codePlace', 'Auto-generates if left blank')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.description', 'Description')}</label>
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

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2>{t('item.settingsPricing', 'Settings & Pricing')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Purchase Cost</label>
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
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.unit', 'Unit')}</label>
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

              {/* Total Pieces Input / Display */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {isEditing ? t('item.totalStock', 'Total Stock') : t('item.totalPieces', 'Total Pieces')}
                </label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={isEditing ? (itemData?.totalStock || 0) : (totalPieces || '')}
                  onChange={(e) => {
                    if (!isEditing) {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalPieces(val);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground focus:outline-none",
                    isEditing ? "bg-muted cursor-not-allowed" : "bg-background focus:ring-2 focus:ring-primary/50"
                  )}
                  disabled={isSaving || isEditing}
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

    </div>
  );
}
