'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Layers, ArrowLeft, RefreshCw, Save, CheckCircle2, AlertCircle, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import useSWR from 'swr';
import { reservationService } from '@/lib/services/reservation.services';
import { warehouseService } from '@/lib/services/warehouse.services';
import { toast } from 'react-hot-toast';

export function ReservationSplit() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId: rawBookingId } = useParams();
  const bookingId = (rawBookingId as string);
  
  const { data, error, isLoading, mutate } = useSWR(
    bookingId ? `/reservations/booking/${bookingId}` : null,
    () => reservationService.getReservationByBookingId(bookingId)
  );

  const { data: allWarehouses = [] } = useSWR('/warehouses', warehouseService.getWarehouses);

  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Modal states
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [locksToSaveQueue, setLocksToSaveQueue] = useState<any[]>([]);

  // Set warehouses list once loaded
  useEffect(() => {
    if (allWarehouses && allWarehouses.length > 0) {
      setWarehouses(allWarehouses.map((w: any) => ({
        id: w._id,
        name: w.name
      })));
    }
  }, [allWarehouses]);

  useEffect(() => {
    if (data?.reservation) {
      setReservationId(data.reservation._id);
      
      // Initialize allocation state based on requested qty and existing locks if any
      const mappedItems = data.reservation.items.map((i: any) => {
        const itemAllocations: any = {};
        
        if (data.locks && Array.isArray(data.locks)) {
          data.locks.forEach((lock: any) => {
            const itemId = lock.itemId?._id || lock.itemId;
            const itemMatch = itemId?.toString() === i.item?.toString();
            if (itemMatch) {
              const wId = lock.warehouseId?._id || lock.warehouseId;
              itemAllocations[wId] = lock.lockedQty;
            }
          });
        }

        return {
          id: i.item,
          name: i.name,
          code: i.code,
          required: i.requestedQty,
          allocations: itemAllocations // { warehouseId: qty }
        };
      });
      setItems(mappedItems);
    }
  }, [data]);

  const handleSuggestSplit = async () => {
    if (!reservationId) return;
    setIsProcessing(true);
    try {
      const suggestions = await reservationService.suggestSplit(reservationId);
      
      // Extract unique warehouses involved in the suggestion
      const uniqueWarehouses = new Map();
      suggestions.forEach((sugg: any) => {
        sugg.splits.forEach((split: any) => {
          if (!uniqueWarehouses.has(split.warehouseId)) {
            uniqueWarehouses.set(split.warehouseId, { id: split.warehouseId, name: split.warehouseName });
          }
        });
      });
      setWarehouses(Array.from(uniqueWarehouses.values()));

      // Apply suggestions to local state
      const updatedItems = items.map(item => {
        const sugg = suggestions.find((s: any) => s.itemId === item.id);
        const allocations: any = {};
        if (sugg) {
          sugg.splits.forEach((split: any) => {
            allocations[split.warehouseId] = split.allocateQty;
          });
        }
        return { ...item, allocations };
      });
      setItems(updatedItems);
      toast.success('Split algorithm applied');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate split suggestion');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQtyChange = (itemId: string, warehouseId: string, val: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          allocations: { ...item.allocations, [warehouseId]: val } 
        };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!reservationId) return;
    
    // Prepare locks payload
    const locksToSave: any[] = [];
    let hasShortage = false;

    items.forEach(item => {
      let allocatedSum = 0;
      Object.keys(item.allocations).forEach(wId => {
        const qty = item.allocations[wId] || 0;
        allocatedSum += qty;
        if (qty > 0) {
          locksToSave.push({ itemId: item.id, warehouseId: wId, qty });
        }
      });
      if (allocatedSum !== item.required) {
        hasShortage = true;
      }
    });

    if (hasShortage) {
      setLocksToSaveQueue(locksToSave);
      setIsShortageModalOpen(true);
      return;
    }

    await executeSaveLocks(locksToSave);
  };

  const executeSaveLocks = async (locks: any[]) => {
    setIsProcessing(true);
    try {
      await reservationService.lockStock(reservationId!, locks);
      toast.success('Stock successfully locked!');
      mutate(); // refresh data to update status
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to lock stock');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    if (!reservationId) return;
    setIsReleaseModalOpen(true);
  };

  const executeRelease = async () => {
    setIsProcessing(true);
    try {
      await reservationService.releaseStock(reservationId!);
      toast.success('Stock locks released successfully!');
      setWarehouses([]);
      mutate(); // refresh data to update status
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to release stock');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (error) return <div className="p-8 text-center text-error">{error.message || 'Failed to load reservation details'}</div>;

  const bookingRef = data?.reservation?.bookingId?.bookingId || data?.reservation?.bookingId?.bookingNumber || bookingId;
  const reservationStatus = data?.reservation?.status || 'Pending';

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="shrink-0 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">{t('reservation.reserveSplit')}</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Booking: <strong className="text-foreground">{bookingRef}</strong>
              <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                reservationStatus === 'Locked' ? 'bg-emerald-100 text-emerald-800' :
                reservationStatus === 'Released' ? 'bg-gray-100 text-gray-600' :
                'bg-amber-100 text-amber-800'
              }`}>
                {reservationStatus}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          {reservationStatus === 'Locked' ? (
            <Button variant="outline" onClick={handleRelease} disabled={isProcessing} className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50">
              <Unlock className="w-4 h-4" />
              Release Stock
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleSuggestSplit} disabled={isProcessing || reservationStatus === 'Released'} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {t('reservation.recommend')}
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isProcessing || warehouses.length === 0 || reservationStatus === 'Released'} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Allocation
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Items Summary Card — always visible */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Reservation Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Item</th>
                  <th className="p-4">Code</th>
                  <th className="p-4 text-center">Required Qty</th>
                  <th className="p-4 text-center">Locked Qty</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-medium">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="p-4 font-bold text-foreground">{item.name}</td>
                    <td className="p-4 text-muted-foreground font-mono text-[11px]">{item.code}</td>
                    <td className="p-4 text-center font-black">{item.required}</td>
                    <td className="p-4 text-center font-bold">
                      {data?.reservation?.items?.find((ri: any) => ri.item === item.id)?.lockedQty || 0}
                    </td>
                    <td className="p-4 text-center">
                      {data?.reservation?.items?.find((ri: any) => ri.item === item.id)?.isFullyLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Split Allocation Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Godown-wise Split Allocation</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Specify how many quantities are to be allocated from each Godown. Click <strong>"Run Smart Split"</strong> to auto-calculate allocations based on current stock availability.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {warehouses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-sm font-semibold">No Godowns Available</p>
              <p className="text-xs mt-1">Create Godowns in Logistics section to enable stock splitting.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">Item Details</th>
                    <th className="p-4 text-center">Required Qty</th>
                    {warehouses.map(w => (
                      <th key={w.id} className="p-4 text-center">{w.name}</th>
                    ))}
                    <th className="p-4 text-center">Allocated Sum</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground font-medium">
                  {items.map((item) => {
                    let allocatedSum = 0;
                    warehouses.forEach(w => {
                      allocatedSum += item.allocations[w.id] || 0;
                    });
                    
                    const isBalanced = allocatedSum === item.required;
                    const hasShortage = allocatedSum < item.required;
                    const isOver = allocatedSum > item.required;

                    return (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-foreground text-sm">{item.name}</p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{item.code}</span>
                        </td>
                        <td className="p-4 text-center font-black text-base">{item.required}</td>
                        {warehouses.map(w => (
                          <td key={w.id} className="p-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.allocations[w.id] || ''}
                              onChange={(e) => handleQtyChange(item.id, w.id, Number(e.target.value))}
                              className="w-16 px-1 py-1.5 border border-border focus:border-primary text-center rounded-md font-bold text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="p-4 text-center">
                          <span className={`font-black text-sm ${isBalanced ? 'text-emerald-600' : isOver ? 'text-red-600' : 'text-amber-600'}`}>
                            {allocatedSum} / {item.required}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isOver ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-md font-bold text-[10px] uppercase tracking-wide">
                              <AlertCircle className="w-3.5 h-3.5" /> Exceeds Req
                            </span>
                          ) : isBalanced ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] uppercase tracking-wide">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-bold text-[10px] uppercase tracking-wide">
                              <AlertCircle className="w-3.5 h-3.5" /> Shortage
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

      <ConfirmModal
        isOpen={isShortageModalOpen}
        onClose={() => setIsShortageModalOpen(false)}
        onConfirm={() => executeSaveLocks(locksToSaveQueue)}
        title="Proceed with Shortage?"
        message="Some items do not have their required quantities fully allocated. Do you want to proceed with a partial lock?"
        confirmText="Yes, Lock Available"
        cancelText="Cancel"
        isDestructive={false}
      />

      <ConfirmModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirm={executeRelease}
        title="Release Stock Locks"
        message="Are you sure you want to release all currently locked stock for this reservation? It will become available for others."
        confirmText="Release"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}

