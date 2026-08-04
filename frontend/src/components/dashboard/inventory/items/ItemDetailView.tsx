'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Hash, MapPin, Tag, Loader2, IndianRupee, AlertCircle, Layers } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import useSWR from 'swr';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

export function ItemDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  
  const id = params?.id as string;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t('item.deleteConfirm', 'Are you sure you want to delete this item?'))) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await inventoryService.deleteItem(id);
      toast.success(t('item.deleteSuccess', 'Item deleted successfully'));
      router.push('/inventory/items');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error?.response?.data?.message || t('item.deleteError', 'Failed to delete item'));
    } finally {
      setIsDeleting(false);
    }
  };


  // Fetch Item details
  const { data: item, error: itemError, isLoading: itemLoading, mutate: refetchItem } = useSWR(
    id ? `item-detail-${id}` : null,
    () => inventoryService.getItemById(id)
  );

  // Fetch Warehouses to resolve zone/rack names
  const { data: warehouses } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);

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
        const whId = row.warehouse && typeof row.warehouse === 'object' ? String(row.warehouse._id || row.warehouse.id || '') : String(row.warehouse || '');
        const wh = warehouses?.find(w => String(w._id) === whId || String((w as any).id) === whId);
        const zone = wh?.zones?.find((z: any) => String(z._id) === String(row.zoneId) || String(z.id) === String(row.zoneId));
        return <span className="text-foreground">{zone?.name || row.zoneId}</span>;
      } 
    },
    { 
      header: t('item.rack', 'Rack'), 
      accessorKey: 'rackId', 
      cell: (row: any) => {
        if (!row.rackId) return <span className="text-muted-foreground">—</span>;
        const whId = row.warehouse && typeof row.warehouse === 'object' ? String(row.warehouse._id || row.warehouse.id || '') : String(row.warehouse || '');
        const wh = warehouses?.find(w => String(w._id) === whId || String((w as any).id) === whId);
        const zone = wh?.zones?.find((z: any) => String(z._id) === String(row.zoneId) || String(z.id) === String(row.zoneId));
        const rack = zone?.racks?.find((r: any) => String(r._id) === String(row.rackId) || String(r.id) === String(row.rackId));
        return <span className="text-foreground">{rack?.name || row.rackId}</span>;
      } 
    },
    { 
      header: t('item.available', 'Available'), 
      accessorKey: 'quantity', 
      cell: (row: any) => <span className="font-semibold text-emerald-600">{row.quantity - (row.dispatched || 0) - (row.damaged || 0)}</span> 
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
    },
    { 
      header: 'Unit Cost', 
      accessorKey: 'unitCost', 
      cell: (row: any) => (
        <span className="font-semibold text-amber-600">
          {row.unitCost > 0 ? `₹${row.unitCost.toLocaleString()}` : '—'}
        </span>
      )
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
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ActionGuard permission="inventory.delete">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 shrink-0" />}
              <span className="truncate">{t('item.deleteItem', 'Delete Item')}</span>
            </Button>
          </ActionGuard>

          <ActionGuard permission="inventory.update">
            <Button 
              variant="primary" 
              className="flex items-center gap-2"
              onClick={() => router.push(`/inventory/items/${item._id}/edit`)}
              disabled={isDeleting}
            >
              <Edit className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('item.editItem', 'Edit Item')}</span>
            </Button>
          </ActionGuard>
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

      {/* Unified Details Panel (Form Style) */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
        {/* Section 1: Basic & Financial Details */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Layers className="w-5 h-5 text-primary" />
            <h2>{t('item.basicInfo', 'Basic Information')}</h2>
          </div>

          {/* Stock Stats Grid (Top row) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('category.totalItems'), val: item.totalStock, container: 'bg-card border-border', valCls: 'text-foreground' },
              { label: t('item.available'), val: item.availableStock, container: 'bg-emerald-500/5 border-emerald-500/20', valCls: 'text-emerald-600' },
              { label: t('item.rentedOut'), val: item.dispatchedStock, container: 'bg-blue-500/5 border-blue-500/20', valCls: 'text-blue-600' },
              { label: t('item.repair'), val: item.damagedStock, container: 'bg-orange-500/5 border-orange-500/20', valCls: 'text-orange-600' }
            ].map((stat, idx) => (
              <div key={idx} className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm ${stat.container}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</span>
                <span className={`text-2xl font-black ${stat.valCls}`}>{stat.val}</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <p className="text-sm text-foreground bg-muted/30 p-4 rounded-xl border border-border min-h-[106px] leading-relaxed">
                {item.description || t('category.noDescription', 'No description provided.')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 self-start">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Wtd. Avg. Cost/Unit</label>
                <div className="flex h-12 items-center px-4 font-semibold text-foreground bg-muted/10 border border-border rounded-xl">
                  ₹{(item.purchaseCost || 0).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Inventory Value</label>
                <div className="flex h-12 items-center px-4 font-bold text-amber-600 bg-amber-500/5 border border-amber-500/25 rounded-xl">
                  ₹{((item.purchaseCost || 0) * (item.totalStock || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Warehouse Location Breakdown */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2>{t('item.warehouseBreakdown')}</h2>
          </div>
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            {item.warehouseStock.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
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
      </div>

    </div>
  );
}
