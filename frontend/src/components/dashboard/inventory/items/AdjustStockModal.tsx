'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onSuccess: () => void;
}

export function AdjustStockModal({ isOpen, onClose, item, onSuccess }: AdjustStockModalProps) {
  const { t } = useTranslation();
  
  const [warehouseId, setWarehouseId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [rackId, setRackId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Warehouses
  const { data: warehouses, isLoading: warehousesLoading } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);
  const activeWarehouses = (warehouses || []).filter(w => w.isActive);

  // When modal opens or item changes, reset state
  useEffect(() => {
    if (isOpen) {
      setWarehouseId('');
      setZoneId('');
      setRackId('');
      setQuantity('');
      setNotes('');
    }
  }, [isOpen, item]);

  // Handle warehouse change - auto select first zone if exists, else reset
  const handleWarehouseChange = (wid: string) => {
    setWarehouseId(wid);
    const wh = activeWarehouses.find(w => w._id === wid);
    if (wh && wh.zones && wh.zones.length > 0) {
      // Don't auto-select to force user choice or let them leave blank? Better let them choose.
      setZoneId('');
      setRackId('');
    } else {
      setZoneId('');
      setRackId('');
    }
  };

  // Find current quantity based on selections
  const currentStockEntry = item?.warehouseStock?.find(entry => {
    const matchWarehouse = String((entry.warehouse as any)._id || entry.warehouse) === warehouseId;
    const matchZone = entry.zoneId === zoneId || (!entry.zoneId && !zoneId);
    const matchRack = entry.rackId === rackId || (!entry.rackId && !rackId);
    return matchWarehouse && matchZone && matchRack;
  });

  const currentQuantity = currentStockEntry ? currentStockEntry.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!warehouseId) {
      toast.error(t('validation.warehouseRequired', 'Warehouse is required'));
      return;
    }
    if (quantity === '' || quantity < 0) {
      toast.error(t('validation.invalidQuantity', 'Invalid quantity'));
      return;
    }

    setIsSaving(true);
    try {
      await inventoryService.adjustStock(item._id, {
        warehouseId,
        zoneId: zoneId || undefined,
        rackId: rackId || undefined,
        quantity: Number(quantity),
        notes: notes || undefined
      });
      toast.success(t('item.adjustSuccess', 'Stock adjusted successfully'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('item.adjustFail', 'Failed to adjust stock'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !item) return null;

  const selectedWarehouse = activeWarehouses.find(w => w._id === warehouseId);
  const selectedZone = selectedWarehouse?.zones?.find((z: any) => z._id === zoneId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Adjust Stock - {item.name}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('item.warehouse')} *</label>
            <select 
              className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              value={warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              required
              disabled={isSaving || warehousesLoading}
            >
              <option value="" disabled>-- {t('item.selectWarehouse', 'Select Warehouse')} --</option>
              {activeWarehouses.map(wh => (
                <option key={wh._id} value={wh._id}>{wh.name}</option>
              ))}
            </select>
          </div>

          {selectedWarehouse?.zones && selectedWarehouse.zones.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t('item.zone', 'Zone')}</label>
                <select 
                  className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={zoneId}
                  onChange={(e) => {
                    setZoneId(e.target.value);
                    setRackId('');
                  }}
                  disabled={isSaving}
                >
                  <option value="">-- {t('item.selectZone', 'Select Zone')} --</option>
                  {selectedWarehouse.zones.map((z: any) => (
                    <option key={z._id} value={z._id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t('item.rack', 'Rack')}</label>
                <select 
                  className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  value={rackId}
                  onChange={(e) => setRackId(e.target.value)}
                  disabled={!zoneId || isSaving}
                >
                  <option value="">-- {t('item.selectRack', 'Select Rack')} --</option>
                  {selectedZone?.racks?.map((r: any) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {warehouseId && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Quantity:</span>
              <span className="text-lg font-bold text-primary">{currentQuantity} {item.unit}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Total Quantity *</label>
            <Input 
              type="number" 
              min="0"
              placeholder="Enter new total quantity" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason / Notes</label>
            <Input 
              type="text" 
              placeholder="e.g. Audit correction, found extra items" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={isSaving}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              <span>Adjust Stock</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
