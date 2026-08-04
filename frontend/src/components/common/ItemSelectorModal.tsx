'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Minus, Plus, PackageSearch, Warehouse as WarehouseIcon, Layers, Sliders, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/FormDrawer';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { StockAvailabilityItem } from '@/lib/services/quotation.services';

interface StockAvailabilityCheckProps {
  itemId: string;
  requestedQty: number;
  startDate?: string;
  endDate?: string;
  availabilityData?: StockAvailabilityItem;
}

export function StockAvailabilityCheck({ itemId, requestedQty, startDate, endDate, availabilityData }: StockAvailabilityCheckProps) {
  const { t } = useTranslation();

  if (!startDate || !endDate) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg font-sans">
        <PackageSearch className="w-4 h-4" />
        <span>Select dates to check live availability</span>
      </div>
    );
  }

  if (!availabilityData) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg font-sans">
        <PackageSearch className="w-4 h-4 animate-pulse text-primary" />
        <span>Checking availability...</span>
      </div>
    );
  }

  const isAvailable = availabilityData.isFullyAvailable;
  const totalAvailable = availabilityData.totalAvailable;

  return (
    <div className={`flex items-center justify-between text-xs mt-2 p-2 rounded-lg font-sans border ${
      isAvailable ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
    }`}>
      <div className="flex items-center gap-1.5 font-bold">
        <Layers className="w-3.5 h-3.5" />
        <span>Live Stock Status</span>
      </div>
      <div className="flex items-center gap-3">
        {requestedQty > 0 && <span className="opacity-75 font-medium">Req: {requestedQty}</span>}
        <span className="font-extrabold">Avail: {totalAvailable}</span>
      </div>
    </div>
  );
}

export interface ItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: any[]) => void;
  startDate?: string;
  endDate?: string;
  stockAvailabilityMap?: Record<string, StockAvailabilityItem>;
  triggerStockCheck?: (payload: Array<{ item: string; quantity: number }>) => void;
}

export function ItemSelectorModal({
  isOpen,
  onClose,
  onAddItems,
  startDate,
  endDate,
  stockAvailabilityMap = {},
  triggerStockCheck
}: ItemSelectorModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [selectedRackId, setSelectedRackId] = useState<string>('ALL');
  const [expandedItemStocks, setExpandedItemStocks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [itemsRes, warehousesData] = await Promise.all([
          inventoryService.getItems({ limit: 150 }),
          warehouseService.getWarehouses()
        ]);
        setItems(itemsRes.data || []);
        setWarehouses(warehousesData || []);
      } catch (error) {
        console.error('Error loading item selector data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Derived Zones for selected Warehouse
  const selectedWarehouse = warehouses.find(w => w._id === selectedWarehouseId);
  const availableZones = selectedWarehouse?.zones || [];

  // Derived Racks for selected Zone
  const selectedZone = availableZones.find(z => String(z._id) === selectedZoneId || z.name === selectedZoneId);
  const availableRacks = selectedZone?.racks || [];

  // Filter items logic
  const filteredItems = items.filter(item => {
    // 1. Search Query Filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Warehouse Filter
    if (selectedWarehouseId !== 'ALL') {
      const hasWhStock = item.warehouseStock?.some(ws => {
        const whId = typeof ws.warehouse === 'object' ? ws.warehouse._id : ws.warehouse;
        return String(whId) === selectedWarehouseId;
      });
      if (!hasWhStock) return false;
    }

    // 3. Zone Filter
    if (selectedZoneId !== 'ALL') {
      const hasZoneStock = item.warehouseStock?.some(ws => {
        const whId = typeof ws.warehouse === 'object' ? ws.warehouse._id : ws.warehouse;
        const matchesWh = selectedWarehouseId === 'ALL' || String(whId) === selectedWarehouseId;
        return matchesWh && String(ws.zoneId) === selectedZoneId;
      });
      if (!hasZoneStock) return false;
    }

    // 4. Rack Filter
    if (selectedRackId !== 'ALL') {
      const hasRackStock = item.warehouseStock?.some(ws => {
        const whId = typeof ws.warehouse === 'object' ? ws.warehouse._id : ws.warehouse;
        const matchesWh = selectedWarehouseId === 'ALL' || String(whId) === selectedWarehouseId;
        const matchesZone = selectedZoneId === 'ALL' || String(ws.zoneId) === selectedZoneId;
        return matchesWh && matchesZone && String(ws.rackId) === selectedRackId;
      });
      if (!hasRackStock) return false;
    }

    return true;
  });

  const handleQuantitySet = (id: string, value: number) => {
    setSelectedItems(prev => {
      const next = Math.max(0, value);
      
      const newItems = { ...prev };
      if (next === 0) {
        delete newItems[id];
      } else {
        newItems[id] = next;
      }

      if (next > 0 && startDate && endDate && triggerStockCheck) {
        const payload = Object.entries(newItems).map(([itemId, qty]) => ({
          item: itemId,
          quantity: qty
        }));
        if (payload.length > 0) {
          triggerStockCheck(payload);
        }
      }

      return newItems;
    });
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      
      const newItems = { ...prev };
      if (next === 0) {
        delete newItems[id];
      } else {
        newItems[id] = next;
      }

      // Automatically trigger live stock check if date is available
      if (next > 0 && startDate && endDate && triggerStockCheck) {
        const payload = Object.entries(newItems).map(([itemId, qty]) => ({
          item: itemId,
          quantity: qty
        }));
        if (payload.length > 0) {
          triggerStockCheck(payload);
        }
      }

      return newItems;
    });
  };

  const handleAddSelected = () => {
    const itemsToAdd = Object.entries(selectedItems).map(([id, qty]) => {
      const item = items.find(i => i._id === id)!;
      return {
        id: item._id,
        code: item.code,
        name: item.name,
        rate: item.rentalPrice || 0,
        unit: item.unit || 'Pieces',
        qty: qty,
        total: (item.rentalPrice || 0) * qty,
      };
    });

    onAddItems(itemsToAdd);
    setSelectedItems({});
    onClose();
  };

  const totalSelectedItems = Object.keys(selectedItems).length;
  const totalSelectedQty = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.selectItems', 'Select Inventory Items')}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button 
            variant="primary" 
            onClick={handleAddSelected}
            disabled={totalSelectedItems === 0}
          >
            Add {totalSelectedItems} Item(s)
          </Button>
        </>
      }
    >
      <div className="space-y-6 font-sans">
        {startDate && endDate && (
          <div className="bg-primary/10 text-primary p-3 rounded-xl text-sm font-medium border border-primary/20 flex items-center justify-between">
            <span>Event Schedule: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span>
            <span className="text-xs font-bold bg-primary/20 px-2.5 py-1 rounded-full">Live Availability On</span>
          </div>
        )}

        {/* ─── Location & Category Filter Controls ────────────────────────────── */}
        <div className="bg-muted/40 p-4 rounded-2xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Filter Inventory by Godown & Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Warehouse Selector */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Warehouse / Godown</label>
              <div className="relative">
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setSelectedWarehouseId(e.target.value);
                    setSelectedZoneId('ALL');
                    setSelectedRackId('ALL');
                  }}
                  className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ALL">All Godowns</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Zone Selector */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Zone / Area</label>
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value);
                  setSelectedRackId('ALL');
                }}
                disabled={selectedWarehouseId === 'ALL' || availableZones.length === 0}
                className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="ALL">All Zones</option>
                {availableZones.map((z, idx) => (
                  <option key={z._id || idx} value={String(z._id || z.name)}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Rack Selector */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Rack / Shelf</label>
              <select
                value={selectedRackId}
                onChange={(e) => setSelectedRackId(e.target.value)}
                disabled={selectedZoneId === 'ALL' || availableRacks.length === 0}
                className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="ALL">All Racks</option>
                {availableRacks.map((r, idx) => (
                  <option key={r._id || idx} value={String(r._id || r.name)}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative pt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('item.searchPlace', 'Search items by name or SKU code...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* ─── Item Cards List ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center p-12 text-muted-foreground animate-pulse font-medium">Loading inventory items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-2xl text-muted-foreground">
            <PackageSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-foreground">No items match your filter criteria.</p>
            <p className="text-xs text-muted-foreground mt-1">Try clearing godown or zone filters.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredItems.map(item => {
              const selectedQty = selectedItems[item._id] || 0;

              return (
                <div key={item._id} className={`p-4 rounded-2xl border transition-all ${selectedQty > 0 ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-card'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{item.code}</span>
                      </div>
                      
                      <h4 className="font-bold text-foreground text-base tracking-tight truncate">{item.name}</h4>
                      
                      {/* Warehouse & Rack Badges */}
                      {item.warehouseStock && item.warehouseStock.length > 0 && (() => {
                        const getMatch = (ws: any) => {
                          const whId = typeof ws.warehouse === 'object' ? ws.warehouse._id : ws.warehouse;
                          const matchesWh = selectedWarehouseId === 'ALL' || String(whId) === selectedWarehouseId;
                          const matchesZone = selectedZoneId === 'ALL' || String(ws.zoneId) === selectedZoneId;
                          const matchesRack = selectedRackId === 'ALL' || String(ws.rackId) === selectedRackId;
                          return matchesWh && matchesZone && matchesRack;
                        };

                        const matchedStocks = item.warehouseStock.filter(getMatch);
                        const stocksToRender = selectedWarehouseId === 'ALL' ? item.warehouseStock : matchedStocks;

                        return (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex flex-col gap-1.5">
                              {stocksToRender.map((ws, idx) => {
                                const whObj = typeof ws.warehouse === 'object' ? ws.warehouse : warehouses.find(w => String(w._id) === String(ws.warehouse));
                                const whName = (whObj as any)?.name || 'Godown';
                                const zoneObj = (whObj as any)?.zones?.find((z: any) => String(z._id) === String(ws.zoneId) || z.name === ws.zoneId);
                                const rackObj = zoneObj?.racks?.find((r: any) => String(r._id) === String(ws.rackId) || r.name === ws.rackId);
                                const zoneName = zoneObj?.name;
                                const rackName = rackObj?.name;
                                const isMatched = getMatch(ws);

                                return (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all ${
                                      isMatched 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 font-semibold shadow-sm' 
                                        : 'bg-muted/40 border-border/50 text-muted-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <WarehouseIcon className={`w-3.5 h-3.5 shrink-0 ${isMatched ? 'text-primary' : 'text-muted-foreground/60'}`} />
                                      <span className="truncate max-w-[150px] font-bold">{whName}</span>
                                      {zoneName && <span className="opacity-70 truncate">• {zoneName}</span>}
                                      {rackName && <span className="opacity-60 truncate">({rackName})</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                                      <span className="opacity-60 text-[10px] uppercase font-bold">Stock:</span>
                                      <span className="font-extrabold text-foreground text-sm">{ws.quantity}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mt-2">
                        <StockAvailabilityCheck itemId={item._id} requestedQty={selectedQty > 0 ? selectedQty : 1} startDate={startDate} endDate={endDate} availabilityData={stockAvailabilityMap[item._id]} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center h-full shrink-0">
                      <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-1 shadow-inner">
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item._id, -1)}
                          disabled={selectedQty === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted text-foreground hover:bg-border disabled:opacity-40 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          maxLength={5}
                          value={selectedQty === 0 ? '' : selectedQty}
                          placeholder="0"
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 5) val = val.slice(0, 5);
                            const num = val === '' ? 0 : Number(val);
                            handleQuantitySet(item._id, Math.min(num, 99999));
                          }}
                          className="w-12 text-center font-bold text-sm bg-transparent border-none focus:outline-none p-0"
                        />
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormDrawer>
  );
}
