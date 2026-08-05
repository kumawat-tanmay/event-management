'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ClipboardCheck, CheckCircle2, 
  AlertTriangle, Save, Store
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';
import { eventExecutionService } from '@/lib/services/eventExecution.services';
import { userService } from '@/lib/services/user.services';
import { warehouseService } from '@/lib/services/warehouse.services';
import { toast } from 'react-hot-toast';
import { PhotoUpload } from '../gallery/PhotoUpload';

export function ReturnVerificationForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const { data: booking, mutate: mutateBooking } = useSWR(
    bookingId ? `/bookings/${bookingId}` : null,
    () => bookingService.getBookingById(bookingId)
  );
  const { data: users = [] } = useSWR('/users', () => userService.getUsers());
  const { data: warehouses = [] } = useSWR('/warehouses', () => warehouseService.getWarehouses());

  const [items, setItems] = useState<any[]>([]);
  const [remarks, setRemarks] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [photos, setPhotos] = useState<(File | string)[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking?.assignedSupervisor && !supervisorName) {
      const sup = booking.assignedSupervisor;
      const name = typeof sup === 'object' ? sup.name : sup;
      setSupervisorName(name || '');
    }
  }, [booking, supervisorName]);

  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !warehouseId) {
      const defaultWh = warehouses.find((w: any) => w.isDefault) || warehouses[0];
      setWarehouseId(defaultWh?._id || '');
    }
  }, [warehouses, warehouseId]);

  useEffect(() => {
    if (booking && booking.items && items.length === 0) {
      setItems(
        booking.items.map((i: any) => {
          const qty = i.quantity || i.qty || 1;
          return {
            item: typeof i.item === 'object' ? i.item._id : i.item,
            name: i.itemName || i.name || 'Equipment Item',
            code: i.itemCode || i.code || '',
            dispatched: qty,
            returnedGood: qty,
            returnedDamaged: 0,
            missing: 0,
          };
        })
      );
    }
  }, [booking, items.length]);

  const updateItemQty = (index: number, field: string, val: number) => {
    const cleanVal = Math.max(0, val);
    setItems(
      items.map((it, idx) => (idx === index ? { ...it, [field]: cleanVal } : it))
    );
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    if (items.length === 0) {
      toast.error('No items found in booking to settle return');
      return;
    }

    setSubmitting(true);
    try {
      await eventExecutionService.submitReturnAndSettle({
        bookingId,
        remarks,
        supervisorName,
        photos,
        warehouseId,
        returnItems: items.map(it => ({
          item: it.item,
          name: it.name,
          code: it.code,
          requestedQty: it.dispatched,
          dispatchedQty: it.dispatched,
          returnedGoodQty: Number(it.returnedGood),
          returnedDamagedQty: Number(it.returnedDamaged),
          missingQty: Number(it.missing),
        })),
      });

      toast.success(t('events.settlementSuccess', 'Godown stock settled successfully!'));
      mutateBooking();
      router.push(`/events/list/${bookingId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to settle stock return');
    } finally {
      setSubmitting(false);
    }
  };

  const bookingRef = booking?.bookingId || (booking as any)?.bookingNumber || 'BK-2026';
  const isAlreadyReturned = booking?.status === 'Completed' || (booking as any)?.status === 'Returned';

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title={t('events.returnChecklist')} 
            description={`Itemized QC and stock settlement for ${bookingRef}`}
          />
        </div>
      </div>

      <form onSubmit={handleSettle} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Logistics Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-primary">
                  {bookingRef}
                </span>
                <StatusBadge status={isAlreadyReturned ? 'Confirmed' : 'Pending'} customText={booking?.status || 'Active'} />
              </div>
              <CardTitle className="text-lg font-bold leading-tight">{booking?.eventTitle || 'Event Setup'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <Store className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{booking?.venueAddress || 'Main Godown'}</p>
                  <p className="text-xs text-muted-foreground">Venue Location</p>
                </div>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-foreground">Supervisor Name</label>
                <select
                  className="w-full h-9 px-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  value={supervisorName}
                  onChange={e => setSupervisorName(e.target.value)}
                  disabled={isAlreadyReturned}
                >
                  <option value="">-- Select Supervisor --</option>
                  {users.map((u: any) => (
                    <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-foreground">Destination Warehouse</label>
                <select
                  className="w-full h-9 px-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  disabled={isAlreadyReturned}
                >
                  <option value="">-- Select Destination Godown --</option>
                  {warehouses.map((w: any) => (
                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-xs font-semibold text-foreground">{t('events.remarksDiscrepancies')}</label>
                <textarea 
                  className="w-full h-24 p-3 border border-border rounded-lg bg-background text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Notes on missing or damaged items..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-xs font-semibold text-foreground">Return Setup Photos</label>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Checklist */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Item Quality Control (QC) & Stock Settlement
              </CardTitle>
              <Button type="submit" variant="primary" size="sm" disabled={submitting || isAlreadyReturned}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Settling Stock...' : isAlreadyReturned ? 'Already Settled' : t('events.verifyAndSettle')}
              </Button>
            </CardHeader>
            
            <CardContent className="pt-0 p-0 flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-muted/50 uppercase text-muted-foreground font-black tracking-wider border-b border-border">
                  <tr>
                    <th className="p-4">Item Details</th>
                    <th className="p-4 text-center">Dispatched</th>
                    <th className="p-4 text-center text-emerald-600 font-bold">{t('events.returnedGood')}</th>
                    <th className="p-4 text-center text-amber-600 font-bold">{t('events.returnedDamaged')}</th>
                    <th className="p-4 text-center text-red-600 font-bold">{t('events.missingQty')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground font-medium">
                  {items.map((item, idx) => (
                    <tr key={item.item || idx} className="hover:bg-muted/10">
                      <td className="p-4">
                        <p className="font-bold text-foreground text-sm">{item.name}</p>
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{item.code}</span>
                      </td>
                      <td className="p-4 text-center font-black text-sm">{item.dispatched}</td>
                      <td className="p-4 text-center">
                        <input 
                          type="number" 
                          min="0"
                          max={item.dispatched}
                          value={item.returnedGood}
                          onChange={(e) => updateItemQty(idx, 'returnedGood', Number(e.target.value))}
                          disabled={isAlreadyReturned}
                          className="w-16 text-center text-sm font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 rounded py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input 
                          type="number" 
                          min="0"
                          max={item.dispatched}
                          value={item.returnedDamaged}
                          onChange={(e) => updateItemQty(idx, 'returnedDamaged', Number(e.target.value))}
                          disabled={isAlreadyReturned}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1.5 outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60",
                            item.returnedDamaged > 0 ? "border-amber-400 bg-amber-50 text-amber-800" : "border-border bg-background"
                          )}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input 
                          type="number" 
                          min="0"
                          max={item.dispatched}
                          value={item.missing}
                          onChange={(e) => updateItemQty(idx, 'missing', Number(e.target.value))}
                          disabled={isAlreadyReturned}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1.5 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60",
                            item.missing > 0 ? "border-red-400 bg-red-50 text-red-800" : "border-border bg-background"
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
