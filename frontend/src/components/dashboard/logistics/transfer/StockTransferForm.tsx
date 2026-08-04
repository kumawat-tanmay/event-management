'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Building2, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import useSWR from 'swr';
import { warehouseService } from '@/lib/services/warehouse.services';
import { inventoryService } from '@/lib/services/inventory.services';
import { warehouseTransferService } from '@/lib/services/warehouseTransfer.services';
import { toast } from 'react-hot-toast';
import { getWarehouseTransferSchema } from '@/utils/validations';

interface StockTransferFormProps {
  transferId?: string;
}

export function StockTransferForm({ transferId }: StockTransferFormProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isEditMode = !!transferId;

  // Form states
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [transferStatus, setTransferStatus] = useState('Requested');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch warehouses and items list
  const { data: warehouses = [] } = useSWR('/warehouses', () => warehouseService.getWarehouses());
  const { data: itemsResponse } = useSWR('/inventory/items', () => inventoryService.getItems({ limit: 100 }));
  const items = itemsResponse?.data || [];

  const getAvailableStockInGodown = (itemDoc: any, whId: string) => {
    if (!whId || !itemDoc?.warehouseStock) return 0;
    const entry = itemDoc.warehouseStock.find((ws: any) => {
      const entryWhId = typeof ws.warehouse === 'object' ? ws.warehouse?._id : ws.warehouse;
      return String(entryWhId) === String(whId);
    });
    if (!entry) return 0;
    const qty = Number(entry.quantity) || 0;
    const dispatched = Number(entry.dispatched) || 0;
    const damaged = Number(entry.damaged) || 0;
    return Math.max(0, qty - dispatched - damaged);
  };

  // Load transfer details in edit mode
  useEffect(() => {
    if (isEditMode && transferId) {
      warehouseTransferService.getTransferById(transferId).then((data) => {
        if (data) {
          setFromWarehouse(data.fromWarehouse?._id || data.fromWarehouse || '');
          setToWarehouse(data.toWarehouse?._id || data.toWarehouse || '');
          setRemarks(data.remarks || '');
          setTransferStatus(data.status || 'Requested');
          
          setSelectedItems(
            data.items.map((i: any) => ({
              item: typeof i.item === 'object' ? i.item._id : i.item,
              name: i.name || 'Equipment Item',
              code: i.code || '',
              quantity: i.quantity || 1,
              maxStock: 9999,
            }))
          );
        }
      }).catch(() => {
        toast.error('Failed to load transfer details for editing');
      });
    }
  }, [isEditMode, transferId]);

  // Update maxStock when items are loaded from SWR
  useEffect(() => {
    if (isEditMode && items.length > 0 && selectedItems.length > 0 && fromWarehouse) {
      const updated = selectedItems.map(si => {
        if (si.maxStock === 9999) {
          const itemDoc = items.find((i: any) => i._id === si.item);
          if (itemDoc) {
            return {
              ...si,
              maxStock: getAvailableStockInGodown(itemDoc, fromWarehouse) + si.quantity,
            };
          }
        }
        return si;
      });
      if (JSON.stringify(updated) !== JSON.stringify(selectedItems)) {
        setSelectedItems(updated);
      }
    }
  }, [isEditMode, items, fromWarehouse, selectedItems]);

  const handleAddItem = (itemIdStr: string) => {
    if (!itemIdStr) return;
    if (!fromWarehouse) {
      toast.error(t('validation.fromWarehouseRequired', 'Please select Source Warehouse first'));
      return;
    }
    const itemDoc = items.find((i: any) => i._id === itemIdStr);
    if (!itemDoc) return;

    const sourceStock = getAvailableStockInGodown(itemDoc, fromWarehouse);
    if (sourceStock <= 0) {
      const selectedWh = warehouses.find((w: any) => w._id === fromWarehouse);
      toast.error(`"${itemDoc.name}" has 0 stock in ${selectedWh?.name || 'selected Source Godown'}!`);
      return;
    }

    if (selectedItems.some(i => i.item === itemIdStr)) {
      toast.error('Item is already in transfer list');
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        item: itemDoc._id,
        name: itemDoc.name,
        code: itemDoc.code,
        quantity: 1,
        maxStock: sourceStock,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index: number, val: number) => {
    const item = selectedItems[index];
    const cleanVal = Math.min(Math.max(1, val), item.maxStock);
    setSelectedItems(
      selectedItems.map((si, i) => (i === index ? { ...si, quantity: cleanVal } : si))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation using getWarehouseTransferSchema(t)
    const schema = getWarehouseTransferSchema(t);
    const result = schema.safeParse({
      fromWarehouse,
      toWarehouse,
      remarks,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const fieldName = issue.path[0] as string;
        if (fieldName) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      const firstMsg = result.error.issues[0]?.message || 'Please fix form validation errors';
      toast.error(firstMsg);
      return;
    }

    if (selectedItems.length === 0) {
      toast.error(t('validation.itemsRequired', 'Please add at least 1 item to transfer'));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        fromWarehouse,
        toWarehouse,
        remarks,
        items: selectedItems.map(i => ({
          item: i.item,
          name: i.name,
          code: i.code || '',
          quantity: Number(i.quantity),
        })),
      };

      if (isEditMode && transferId) {
        await warehouseTransferService.updateTransfer(transferId, payload);
        toast.success('Stock Transfer request updated successfully!');
      } else {
        await warehouseTransferService.createTransfer(payload);
        toast.success('Stock Transfer request created successfully!');
      }

      router.push('/logistics/transfer');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save transfer request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/logistics/transfer')}
          className="shrink-0 text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">
            {isEditMode ? t('transfer.editTransfer') : t('transfer.newTransfer')}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {t('transfer.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isEditMode && transferStatus !== 'Requested' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-bold leading-relaxed flex items-start gap-2">
            <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Status: {transferStatus}. Only remarks and purpose logs are editable once shipped.
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {t('transfer.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">{t('transfer.sourceGodown')}</label>
                <select
                  className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 ${
                    errors.fromWarehouse ? 'border-error' : 'border-border'
                  }`}
                  value={fromWarehouse}
                  onChange={e => {
                    setFromWarehouse(e.target.value);
                    setSelectedItems([]);
                    setErrors(prev => ({ ...prev, fromWarehouse: '' }));
                  }}
                  disabled={isEditMode}
                >
                  <option value="">-- Select Source Godown --</option>
                  {isEditMode ? (
                    <option value={fromWarehouse}>Active Source Godown</option>
                  ) : null}
                  {warehouses.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                {errors.fromWarehouse && <p className="text-[11px] font-semibold text-error">{errors.fromWarehouse}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">{t('transfer.destGodown')}</label>
                <select
                  className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 ${
                    errors.toWarehouse ? 'border-error' : 'border-border'
                  }`}
                  value={toWarehouse}
                  onChange={e => {
                    setToWarehouse(e.target.value);
                    setErrors(prev => ({ ...prev, toWarehouse: '' }));
                  }}
                  disabled={isEditMode}
                >
                  <option value="">-- Select Destination Godown --</option>
                  {isEditMode ? (
                    <option value={toWarehouse}>Active Destination Godown</option>
                  ) : null}
                  {warehouses.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                {errors.toWarehouse && <p className="text-[11px] font-semibold text-error">{errors.toWarehouse}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">{t('transfer.remarks')}</label>
              <textarea
                className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Relocating equipment for upcoming Jaipur wedding setup"
              />
            </div>
          </CardContent>
        </Card>

        {/* Item selector section */}
        {fromWarehouse && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                {t('transfer.transferItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(isEditMode && transferStatus !== 'Requested') && (
                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-bold text-foreground">Add Item</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value=""
                    onChange={e => handleAddItem(e.target.value)}
                  >
                    <option value="">-- Search & Choose Equipment --</option>
                    {items.map((i: any) => (
                      <option key={i._id} value={i._id}>
                        {i.name} ({i.code}) — Avail: {getAvailableStockInGodown(i, fromWarehouse)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedItems.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Item Details</th>
                        <th className="p-4 text-center">Available Stock</th>
                        <th className="p-4 text-center">Transfer Qty</th>
                        {!(isEditMode && transferStatus !== 'Requested') && <th className="p-4 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground font-medium">
                      {selectedItems.map((item, idx) => (
                        <tr key={item.item || idx} className="hover:bg-muted/10">
                          <td className="p-4">
                            <p className="font-bold text-foreground text-sm">{item.name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{item.code}</span>
                          </td>
                          <td className="p-4 text-center font-bold text-sm text-muted-foreground">
                            {isEditMode && transferStatus !== 'Requested' ? '—' : item.maxStock}
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="text"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={e => {
                                let val = e.target.value.replace(/[^0-9]/g, '');
                                let num = val === '' ? 0 : Number(val);
                                if (num > item.maxStock) num = item.maxStock;
                                handleQtyChange(idx, num);
                              }}
                              disabled={isEditMode && transferStatus !== 'Requested'}
                              className="w-20 px-2 py-1.5 border border-border focus:border-primary text-center rounded-md font-bold text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                            />
                          </td>
                          {!(isEditMode && transferStatus !== 'Requested') && (
                            <td className="p-4 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-muted-foreground hover:text-error h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/logistics/transfer')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || selectedItems.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Submitting...' : isEditMode ? 'Update Transfer Request' : t('transfer.newTransfer')}
          </Button>
        </div>
      </form>
    </div>
  );
}
