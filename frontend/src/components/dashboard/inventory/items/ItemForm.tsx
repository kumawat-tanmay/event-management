'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Save, Box, IndianRupee, Settings, Loader2, Plus, Warehouse as WarehouseIcon, Layers, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { getItemSchema, sanitizeNumberInput } from '@/utils/validations';
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
  const [customUnitText, setCustomUnitText] = useState('');

  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Warehouse Stock Location State (for both Create & Edit modes)
  type StockLocationRow = {
    warehouseId: string;
    zoneId: string;
    zoneName?: string;
    rackId: string;
    rackName?: string;
    addedQty: number;
    unitCost: number;
  };
  const [stockLocations, setStockLocations] = useState<StockLocationRow[]>([]);
  const [originalStock, setOriginalStock] = useState<{
    warehouseId: string;
    zoneId: string;
    rackId: string;
    quantity: number;
    unitCost: number;
  }[]>([]);

  // Fetch Warehouses for location list
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
      const predefinedUnits = ['Pieces','Sets','SqFt','Meters','Kg','Rolls','Bundles','Pairs','Boxes'];
      if (predefinedUnits.includes(itemData.unit)) {
        setUnit(itemData.unit);
      } else {
        setUnit('Custom');
        setCustomUnitText(itemData.unit);
      }
      setPurchaseCost(itemData.purchaseCost);
      setMinStockAlert(itemData.minStockAlert);
      setIsActive(itemData.isActive);
      setImage(itemData.image || '');
      
      if (itemData.warehouseStock && itemData.warehouseStock.length > 0) {
        const locations = itemData.warehouseStock.map((ws: any) => {
          let whId = '';
          if (ws.warehouse) {
            if (typeof ws.warehouse === 'object') {
              whId = ws.warehouse._id || ws.warehouse.id || '';
            } else {
              whId = String(ws.warehouse);
            }
          }
          return {
            warehouseId: whId,
            zoneId: ws.zoneId || '',
            rackId: ws.rackId || '',
            quantity: ws.quantity || 0,
            unitCost: ws.unitCost || 0
          };
        });
        setOriginalStock(locations);
        setStockLocations(locations.map(loc => ({
          warehouseId: loc.warehouseId,
          zoneId: loc.zoneId,
          rackId: loc.rackId,
          addedQty: 0,
          unitCost: 0
        })));
      } else {
        setOriginalStock([]);
        setStockLocations([]);
      }
    }
  }, [itemData]);

  const findOriginalQty = (whId: string, zoneId: string, rackId: string) => {
    if (!whId || zoneId === 'custom' || rackId === 'custom') return 0;
    const match = originalStock.find(os =>
      String(os.warehouseId || '') === String(whId || '') &&
      String(os.zoneId || '') === String(zoneId || '') &&
      String(os.rackId || '') === String(rackId || '')
    );
    return match ? match.quantity : 0;
  };

  const addStockLocation = () => {
    setStockLocations(prev => [
      ...prev,
      { warehouseId: '', zoneId: '', rackId: '', addedQty: 0, unitCost: 0 }
    ]);
  };

  const removeStockLocation = (index: number) => {
    setStockLocations(prev => prev.filter((_, i) => i !== index));
  };

  const updateStockLocation = (index: number, field: keyof StockLocationRow, value: any) => {
    setStockLocations(prev => prev.map((loc, i) => {
      if (i === index) {
        const updated = { ...loc, [field]: value };
        if (field === 'warehouseId') {
          updated.zoneId = '';
          updated.zoneName = '';
          updated.rackId = '';
          updated.rackName = '';
        } else if (field === 'zoneId') {
          updated.rackId = '';
          updated.rackName = '';
          if (value !== 'custom') {
            updated.zoneName = '';
          }
        } else if (field === 'rackId') {
          if (value !== 'custom') {
            updated.rackName = '';
          }
        }
        return updated;
      }
      return loc;
    }));
  };

  const totalPieces = stockLocations.reduce((sum, loc) => {
    const currentQty = findOriginalQty(loc.warehouseId, loc.zoneId, loc.rackId);
    return sum + currentQty + (loc.addedQty || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLocations = stockLocations.filter(loc => loc.warehouseId);

    const payload = {
      name,
      code: code || undefined,
      description,
      unit: unit === 'Custom' ? (customUnitText.trim() || 'Pieces') : unit,
      rentalPrice: 0,
      totalStock: totalPieces,
      purchaseCost: Number(purchaseCost) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      isActive,
      warehouseStock: validLocations
        .filter(loc => (Number(loc.addedQty) || 0) > 0)
        .map(loc => {
          // If zoneId/rackId is not custom and is provided, use it. Otherwise, use zoneName/rackName.
          const useZoneName = !loc.zoneId || loc.zoneId === 'custom';
          const useRackName = !loc.rackId || loc.rackId === 'custom';
          return {
            warehouse: loc.warehouseId,
            zoneId: !useZoneName ? (loc.zoneId || undefined) : undefined,
            zoneName: useZoneName ? (loc.zoneName?.trim() || undefined) : undefined,
            rackId: !useRackName ? (loc.rackId || undefined) : undefined,
            rackName: useRackName ? (loc.rackName?.trim() || undefined) : undefined,
            quantity: Number(loc.addedQty) || 0,
            unitCost: Number(loc.unitCost) || Number(purchaseCost) || 0
          };
        })
    };

    const validationResult = getItemSchema(t).safeParse(payload);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid item data';
      toast.error(firstIssue);
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing && id) {
        await inventoryService.updateItem(id, payload);
        toast.success(t('item.updateSuccess', 'Item updated successfully!'));
      } else {
        await inventoryService.createItem(payload);
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
                    type="text"
                    placeholder="0.00"
                    value={purchaseCost || ''}
                    onChange={(e) => setPurchaseCost(Number(sanitizeNumberInput(e.target.value)))}
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
                    <option value="Custom">Custom (Type manually...)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                {unit === 'Custom' && (
                  <div className="mt-2 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Unit Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Feet, Bags, Litres"
                      value={customUnitText}
                      onChange={(e) => setCustomUnitText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      disabled={isSaving}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.minStockAlert')}</label>
                <input
                  type="text"
                  placeholder="e.g. 5"
                  value={minStockAlert || ''}
                  onChange={(e) => setMinStockAlert(Number(sanitizeNumberInput(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  disabled={isSaving}
                />
              </div>

              {/* Total Pieces Input / Display */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('item.totalStock', 'Total Stock')}
                </label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={totalPieces}
                  readOnly
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none cursor-not-allowed font-bold"
                  disabled
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
          {/* Section 3: Warehouse Stock Locations & Quantities */}
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-1">
                <WarehouseIcon className="w-5 h-5 text-primary" />
                <h2>{t('item.warehouseOpeningStock', 'Warehouse Stock Locations')}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('item.warehouseStockSub', 'Manage stock quantities across warehouses, zones, and racks')}
              </p>
            </div>

            <div className="space-y-4">
              {stockLocations.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
                  No stock locations assigned to this item yet. Click "Add Location Row" below to assign stock.
                </div>
              ) : (
                <div className="space-y-3">
                  {stockLocations.map((loc, index) => {
                    const wh = activeWarehouses.find(w => w._id === loc.warehouseId);
                    const zones = wh?.zones || [];
                    const selectedZone = zones.find((z: any) => z._id === loc.zoneId);
                    const racks = selectedZone?.racks || [];

                    return (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-border rounded-2xl">
                        {/* 1. Warehouse Selector */}
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Warehouse</label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={loc.warehouseId}
                            onChange={(e) => updateStockLocation(index, 'warehouseId', e.target.value)}
                            disabled={isSaving}
                          >
                            <option value="">-- Select Warehouse --</option>
                            {activeWarehouses.map(w => (
                              <option key={w._id} value={w._id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Zone */}
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Zone</label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
                            value={loc.zoneId}
                            onChange={(e) => updateStockLocation(index, 'zoneId', e.target.value)}
                            disabled={!loc.warehouseId || isSaving}
                          >
                            <option value="">-- Select Zone --</option>
                            {zones.map((z: any) => (
                              <option key={z._id} value={z._id}>{z.name}</option>
                            ))}
                            {loc.warehouseId && (
                              <option value="custom">Custom (Type manually...)</option>
                            )}
                          </select>
                          {loc.zoneId === 'custom' && (
                            <Input
                              type="text"
                              placeholder="Enter Custom Zone Name"
                              value={loc.zoneName || ''}
                              onChange={(e) => updateStockLocation(index, 'zoneName', e.target.value)}
                              disabled={isSaving}
                              className="mt-1 h-10 text-xs focus:ring-primary"
                            />
                          )}
                        </div>

                        {/* 3. Rack */}
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Rack</label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
                            value={loc.rackId}
                            onChange={(e) => updateStockLocation(index, 'rackId', e.target.value)}
                            disabled={!loc.zoneId || isSaving}
                          >
                            <option value="">-- Select Rack --</option>
                            {racks.map((r: any) => (
                              <option key={r._id} value={r._id}>{r.name}</option>
                            ))}
                            {loc.zoneId && (
                              <option value="custom">Custom (Type manually...)</option>
                            )}
                          </select>
                          {loc.rackId === 'custom' && (
                            <Input
                              type="text"
                              placeholder="Enter Custom Rack Name"
                              value={loc.rackName || ''}
                              onChange={(e) => updateStockLocation(index, 'rackName', e.target.value)}
                              disabled={isSaving}
                              className="mt-1 h-10 text-xs focus:ring-primary"
                            />
                          )}
                        </div>

                        {/* 4. Current Stock (Read-only) - Only in EDIT mode */}
                        {isEditing && (
                          <div className="w-full sm:w-20 space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Current</label>
                            <div className="flex h-10 w-full items-center justify-end px-3 py-2 text-xs font-bold text-muted-foreground bg-muted border border-border rounded-xl">
                              {findOriginalQty(loc.warehouseId, loc.zoneId, loc.rackId)}
                            </div>
                          </div>
                        )}

                        {/* 4b. Current Unit Cost (Read-only) - Only in EDIT mode */}
                        {isEditing && (() => {
                          const orig = originalStock.find(os =>
                            String(os.warehouseId || '') === String(loc.warehouseId || '') &&
                            String(os.zoneId || '') === String(loc.zoneId || '') &&
                            String(os.rackId || '') === String(loc.rackId || '')
                          );
                          return orig && orig.unitCost > 0 ? (
                            <div className="w-full sm:w-24 space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Cur. Cost</label>
                              <div className="flex h-10 w-full items-center justify-end px-3 py-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                ₹{orig.unitCost.toLocaleString()}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* 5. Add Stock Input / Stock Qty */}
                        <div className="w-full sm:w-24 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase text-primary">
                            {isEditing ? 'Add Stock' : 'Stock Qty'}
                          </label>
                          <Input
                            type="text"
                            placeholder="0"
                            value={loc.addedQty || ''}
                            onChange={(e) => updateStockLocation(index, 'addedQty', Number(sanitizeNumberInput(e.target.value)))}
                            disabled={isSaving}
                            className="text-right h-10 focus:ring-primary"
                          />
                        </div>

                        {/* 5b. New Cost/Unit Input (only in EDIT mode when addedQty > 0) */}
                        {isEditing && (loc.addedQty || 0) > 0 && (
                          <div className="w-full sm:w-28 space-y-1">
                            <label className="text-[10px] font-bold text-emerald-600 uppercase">₹ Cost/Unit</label>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={loc.unitCost || ''}
                              onChange={(e) => updateStockLocation(index, 'unitCost', Number(sanitizeNumberInput(e.target.value)))}
                              disabled={isSaving}
                              className="text-right h-10 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-700"
                            />
                          </div>
                        )}

                        {/* 6. Total Qty (Computed) - Only in EDIT mode */}
                        {isEditing && (
                          <div className="w-full sm:w-20 space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Total</label>
                            <div className="flex h-10 w-full items-center justify-end px-3 py-2 text-xs font-bold text-foreground bg-zinc-100 dark:bg-zinc-800 border border-border rounded-xl">
                              {findOriginalQty(loc.warehouseId, loc.zoneId, loc.rackId) + (loc.addedQty || 0)}
                            </div>
                          </div>
                        )}

                        {/* 5. Delete Action */}
                        <div className="pt-5 sm:pt-4 self-end sm:self-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStockLocation(index)}
                            disabled={isSaving}
                            className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addStockLocation}
                disabled={isSaving}
                className="w-full h-11 border-dashed border-2 flex items-center justify-center gap-2 hover:bg-muted/50 rounded-2xl font-bold"
              >
                <Plus className="w-4 h-4 text-primary" />
                Add Stock Location Row
              </Button>
            </div>
          </div>
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
