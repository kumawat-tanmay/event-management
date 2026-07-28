'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Hash, MapPin, Tag, Clock, Image as ImageIcon, Loader2, IndianRupee, AlertCircle, Layers } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { AdjustStockModal } from './AdjustStockModal';
import useSWR from 'swr';
import { inventoryService, Item, LedgerEntry } from '@/lib/services/inventory.services';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { useTranslation } from 'react-i18next';

export function ItemDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  
  const id = params?.id as string;
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);

  // Fetch Item details
  const { data: item, error: itemError, isLoading: itemLoading, mutate: refetchItem } = useSWR(
    id ? `item-detail-${id}` : null,
    () => inventoryService.getItemById(id)
  );

  // Fetch recent stock movements for this item
  const { data: ledgerResponse, isLoading: ledgerLoading } = useSWR(
    id ? `item-ledger-${id}` : null,
    () => inventoryService.getLedger({ item: id, limit: 15 })
  );

  // Fetch warehouses to resolve zone/rack names
  const { data: warehouses } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);

  const movements = ledgerResponse?.data || [];

  const movementColumns = [
    { 
      header: t('warehouse.created', 'Date'), 
      accessorKey: 'createdAt', 
      cell: (row: LedgerEntry) => <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span> 
    },
    { 
      header: t('warehouse.status', 'Type'), 
      accessorKey: 'type', 
      cell: (row: LedgerEntry) => (
        <span className={`font-bold text-[11px] px-2 py-1 rounded border uppercase ${
          ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED'].includes(row.type) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          ['STOCK_OUT', 'DAMAGED', 'SCRAPPED'].includes(row.type) ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
          'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }`}>
          {row.type.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: t('item.quantity', 'Quantity'), 
      accessorKey: 'quantity', 
      cell: (row: LedgerEntry) => {
        const isAddition = ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED', 'TRANSFER_IN', 'RELEASED'].includes(row.type);
        return (
          <span className={isAddition ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
            {isAddition ? '+' : '-'}{row.quantity}
          </span>
        );
      }
    },
    { 
      header: t('item.warehouse', 'Warehouse'), 
      accessorKey: 'warehouse', 
      cell: (row: LedgerEntry) => <span>{typeof row.warehouse === 'object' ? row.warehouse.name : '—'}</span> 
    },
    { 
      header: 'Reference', 
      accessorKey: 'reference', 
      cell: (row: LedgerEntry) => <span className="text-primary font-medium">{row.reference || '—'}</span> 
    },
    { 
      header: t('warehouse.manager', 'Handled By'), 
      accessorKey: 'performedBy', 
      cell: (row: LedgerEntry) => <span>{typeof row.performedBy === 'object' ? row.performedBy.name : '—'}</span> 
    },
  ];

  const warehouseBreakdownColumns = [
    { 
      header: t('item.warehouse', 'Warehouse'), 
      accessorKey: 'warehouse.name', 
      cell: (row: any) => <span className="font-bold text-foreground">{row.warehouse?.name || '—'}</span> 
    },
    { 
      header: t('item.zone', 'Zone'), 
      accessorKey: 'zoneId', 
      cell: (row: any) => {
        if (!row.zoneId) return <span className="text-muted-foreground">—</span>;
        const wh = warehouses?.find(w => w._id === row.warehouse?._id);
        const zone = wh?.zones?.find((z: any) => z._id === row.zoneId);
        return <span className="text-foreground">{zone?.name || row.zoneId}</span>;
      } 
    },
    { 
      header: t('item.rack', 'Rack'), 
      accessorKey: 'rackId', 
      cell: (row: any) => {
        if (!row.rackId) return <span className="text-muted-foreground">—</span>;
        const wh = warehouses?.find(w => w._id === row.warehouse?._id);
        const zone = wh?.zones?.find((z: any) => z._id === row.zoneId);
        const rack = zone?.racks?.find((r: any) => r._id === row.rackId);
        return <span className="text-foreground">{rack?.name || row.rackId}</span>;
      } 
    },
    { 
      header: t('item.available', 'Available'), 
      accessorKey: 'quantity', 
      cell: (row: any) => <span className="font-semibold text-emerald-600">{row.quantity - row.reserved - row.dispatched - row.damaged}</span> 
    },
    { 
      header: t('item.reserved', 'Reserved'), 
      accessorKey: 'reserved', 
      cell: (row: any) => <span className="text-blue-500">{row.reserved}</span> 
    },
    { 
      header: t('item.rentedOut', 'Rented Out'), 
      accessorKey: 'dispatched', 
      cell: (row: any) => <span className="text-zinc-600">{row.dispatched}</span> 
    },
    { 
      header: t('item.damaged', 'Damaged'), 
      accessorKey: 'damaged', 
      cell: (row: any) => <span className="text-red-500">{row.damaged}</span> 
    }
  ];

  if (itemLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load item details.')}
      </div>
    );
  }

  const isLowStock = item.totalStock <= item.minStockAlert && item.minStockAlert > 0;
  const categoryName = typeof item.category === 'object' ? (item.category as any).name : '—';

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
              {item.name}
              <StatusBadge status={isLowStock ? 'Low Stock Alert' : item.isActive ? 'Available' : 'Inactive'} className="mt-1" />
            </h1>
          </div>
          <div className="flex items-center gap-4 ml-10 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> {item.code}</span>
            <span className="flex items-center gap-1.5 text-primary"><Tag className="w-4 h-4" /> {categoryName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setAdjustStockModalOpen(true)}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">Adjust Stock</span>
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/inventory/items/${item._id}/edit`)}
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('item.editItem')}</span>
          </Button>
        </div>
      </div>

      {isLowStock && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            <strong>Warning:</strong> Current stock levels ({item.totalStock} {item.unit}) have dropped below the minimum alert threshold of {item.minStockAlert} {item.unit}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Image */}
        <div className="space-y-6">
          {/* Image */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground shadow-sm aspect-video overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No image available</p>
              </>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-3">{t('item.details')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description || t('category.noDescription', 'No description provided.')}
            </p>
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> {t('item.rentalPrice')}</span>
                <span className="text-sm font-semibold text-emerald-500">₹{item.rentalPrice.toLocaleString()}/{item.unit}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><IndianRupee className="w-4 h-4" /> {t('item.purchaseCost')}</span>
                <span className="text-sm font-semibold text-foreground">₹{item.purchaseCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats, Breakdown & Movements */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Stock Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('category.totalItems')}</span>
              <span className="text-3xl font-black text-foreground">{item.totalStock}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">{t('item.available')}</span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{item.availableStock}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-2">{t('item.rentedOut')}</span>
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{item.dispatchedStock}</span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider mb-2">{t('item.repair')}</span>
              <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{item.damagedStock}</span>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[200px]">
            <div className="p-5 border-b border-border bg-muted/20">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t('item.warehouseBreakdown')}
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              {item.warehouseStock.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t('warehouse.noGodowns', 'No stock assigned to warehouses.')}
                </div>
              ) : (
                <DataTable
                  data={item.warehouseStock}
                  columns={warehouseBreakdownColumns}
                />
              )}
            </div>
          </div>

          {/* Movement History */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t('item.recentMovement')}
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              {ledgerLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No stock movements recorded yet.
                </div>
              ) : (
                <DataTable
                  data={movements}
                  columns={movementColumns}
                />
              )}
            </div>
          </div>

        </div>

      </div>

      <AdjustStockModal
        isOpen={adjustStockModalOpen}
        onClose={() => setAdjustStockModalOpen(false)}
        item={item}
        onSuccess={() => {
          refetchItem();
        }}
      />
    </div>
  );
}
