'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import useSWR from 'swr';
import { inventoryService } from '@/lib/services/inventory.services';
import { warehouseService } from '@/lib/services/warehouse.services';

export function WarehouseAvailability() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch items
  const { data: itemsResponse, isLoading: itemsLoading } = useSWR('/inventory/items', () => inventoryService.getItems({ limit: 100 }));
  const items = itemsResponse?.data || [];

  // Fetch warehouses
  const { data: warehouses = [], isLoading: warehousesLoading } = useSWR('/warehouses', warehouseService.getWarehouses);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (typeof item.category === 'object' && item.category?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLoading = itemsLoading || warehousesLoading;

  return (
    <Card className="shadow-md border border-border">
      <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {t('reservation.warehouseAvailability')}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t('reservation.warehouseAvailabilitySub')}</p>
        </div>
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading stocks...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                  {warehouses.map(wh => (
                    <th key={wh._id} className="p-4 text-center">{wh.name}</th>
                  ))}
                  <th className="p-4 text-center">Total Available</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-medium">
                {filteredItems.map((item) => {
                  const isLowStock = item.totalStock < item.minStockAlert;
                  
                  return (
                    <tr key={item._id} className="hover:bg-muted/10">
                      <td className="p-4 font-bold text-foreground">{item.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {typeof item.category === 'object' ? item.category?.name : item.category}
                      </td>
                      {warehouses.map(wh => {
                        const whStock = (item.warehouseStock || []).find(
                          (ws: any) => (typeof ws.warehouse === 'object' ? ws.warehouse?._id : ws.warehouse) === wh._id
                        );
                        // Available stock is: quantity - dispatched - damaged - reserved
                        const qty = whStock ? whStock.quantity : 0;
                        const reserved = whStock ? (whStock.reserved || 0) : 0;
                        const dispatched = whStock ? (whStock.dispatched || 0) : 0;
                        const damaged = whStock ? (whStock.damaged || 0) : 0;
                        const available = Math.max(0, qty - reserved - dispatched - damaged);

                        return (
                          <td key={wh._id} className={`p-4 text-center ${available === 0 ? 'text-muted-foreground bg-muted/5' : 'text-foreground'}`}>
                            {available}
                          </td>
                        );
                      })}
                      <td className="p-4 text-center font-bold">{item.totalStock}</td>
                      <td className="p-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
