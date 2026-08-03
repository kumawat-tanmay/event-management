'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Truck, Save, ClipboardList } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';
import { warehouseService } from '@/lib/services/warehouse.services';
import { dispatchService } from '@/lib/services/dispatch.services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getDispatchSchema } from '@/utils/validations';

interface DispatchFormProps {
  dispatchId?: string;
}

export function DispatchForm({ dispatchId }: DispatchFormProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isEditMode = !!dispatchId;

  // Form states
  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [dispatchItems, setDispatchItems] = useState<any[]>([]);
  const [dispatchStatus, setDispatchStatus] = useState('Loading');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch confirmed bookings and warehouses
  const { data: bookingsRaw } = useSWR('/bookings', () => bookingService.getBookings());
  const bookings: any[] = Array.isArray(bookingsRaw?.data) ? bookingsRaw.data : (Array.isArray(bookingsRaw) ? (bookingsRaw as any) : []);
  const { data: warehouses = [] } = useSWR('/warehouses', () => warehouseService.getWarehouses());

  // Filter out non-cancelled / non-completed bookings for dispatching
  const activeBookings = bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'Stock Locked' || b.status === 'InProgress');

  // Load dispatch details in edit mode
  useEffect(() => {
    if (isEditMode && dispatchId) {
      dispatchService.getDispatchById(dispatchId).then((data) => {
        if (data) {
          setSelectedBooking(data.bookingId?._id || data.bookingId || '');
          setSelectedWarehouse(data.warehouseId?._id || data.warehouseId || '');
          setDriverName(data.driverName || '');
          setDriverPhone(data.driverPhone || '');
          setVehicleNumber(data.vehicleNumber || '');
          setGatePassNumber(data.gatePassNumber || '');
          setDispatchStatus(data.status || 'Loading');
          
          setDispatchItems(
            data.items.map((i: any) => ({
              item: typeof i.item === 'object' ? i.item._id : i.item,
              name: i.name || 'Equipment Item',
              code: i.code || '',
              requestedQty: i.requestedQty || i.dispatchedQty || 1,
              dispatchedQty: i.dispatchedQty || 1,
            }))
          );
        }
      }).catch(() => {
        toast.error('Failed to load dispatch details for editing');
      });
    }
  }, [isEditMode, dispatchId]);

  const handleBookingSelect = (bookingIdStr: string) => {
    setSelectedBooking(bookingIdStr);
    setErrors(prev => ({ ...prev, bookingId: '' }));
    const bk = bookings.find((b: any) => b._id === bookingIdStr);
    if (bk && bk.items) {
      setDispatchItems(
        bk.items.map((i: any) => ({
          item: typeof i.item === 'object' ? i.item._id : i.item,
          name: i.itemName || i.name || 'Equipment Item',
          code: i.itemCode || i.code || '',
          requestedQty: i.quantity || i.qty || 1,
          dispatchedQty: i.quantity || i.qty || 1,
        }))
      );
    } else {
      setDispatchItems([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod validation using getDispatchSchema(t)
    const schema = getDispatchSchema(t);
    const result = schema.safeParse({
      bookingId: selectedBooking,
      warehouseId: selectedWarehouse,
      driverName,
      driverPhone,
      vehicleNumber,
      gatePassNumber: gatePassNumber || undefined,
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

    if (dispatchItems.length === 0) {
      toast.error(t('validation.itemsRequired', 'Please add at least 1 item'));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        bookingId: selectedBooking,
        warehouseId: selectedWarehouse,
        driverName,
        driverPhone,
        vehicleNumber,
        gatePassNumber: gatePassNumber || undefined,
        items: dispatchItems.map(i => ({
          item: i.item,
          name: i.name,
          code: i.code,
          dispatchedQty: Number(i.dispatchedQty),
        })),
      };

      if (isEditMode && dispatchId) {
        await dispatchService.updateDispatch(dispatchId, payload);
        toast.success('Dispatch & Loading Slip updated successfully!');
      } else {
        await dispatchService.createDispatch(payload);
        toast.success('Dispatch & Loading Slip generated successfully!');
      }

      router.push('/logistics/dispatches');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save dispatch');
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
          onClick={() => router.push('/logistics/dispatches')}
          className="shrink-0 text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">
            {isEditMode ? t('dispatches.editSlip') : t('dispatches.newDispatch')}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {t('dispatches.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isEditMode && dispatchStatus !== 'Loading' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-bold leading-relaxed flex items-start gap-2">
            <Truck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Status: {dispatchStatus}. Only driver details and vehicle info are editable once transit starts.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main info card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {t('dispatches.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('dispatches.bookingEvent')}</label>
                  <select
                    className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 ${
                      errors.bookingId ? 'border-error' : 'border-border'
                    }`}
                    value={selectedBooking}
                    onChange={e => handleBookingSelect(e.target.value)}
                    disabled={isEditMode}
                  >
                    <option value="">-- Select Booking --</option>
                    {isEditMode ? (
                      <option value={selectedBooking}>Active Reference</option>
                    ) : null}
                    {activeBookings.map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.bookingId || b.bookingNumber} - {b.eventTitle}
                      </option>
                    ))}
                  </select>
                  {errors.bookingId && <p className="text-[11px] font-semibold text-error">{errors.bookingId}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('dispatches.godownSource')}</label>
                  <select
                    className={`w-full h-10 px-3 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 ${
                      errors.warehouseId ? 'border-error' : 'border-border'
                    }`}
                    value={selectedWarehouse}
                    onChange={e => {
                      setSelectedWarehouse(e.target.value);
                      setErrors(prev => ({ ...prev, warehouseId: '' }));
                    }}
                    disabled={isEditMode}
                  >
                    <option value="">-- Select Godown --</option>
                    {isEditMode ? (
                      <option value={selectedWarehouse}>Active Godown</option>
                    ) : null}
                    {warehouses.map((w: any) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && <p className="text-[11px] font-semibold text-error">{errors.warehouseId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('dispatches.driverName')}
                  value={driverName}
                  onChange={e => {
                    setDriverName(e.target.value);
                    setErrors(prev => ({ ...prev, driverName: '' }));
                  }}
                  error={errors.driverName}
                  placeholder="e.g. Ramesh Kumar"
                />
                <Input
                  label={t('dispatches.driverPhone')}
                  value={driverPhone}
                  onChange={e => {
                    setDriverPhone(e.target.value);
                    setErrors(prev => ({ ...prev, driverPhone: '' }));
                  }}
                  error={errors.driverPhone}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('dispatches.vehicleNumber')}
                  value={vehicleNumber}
                  onChange={e => {
                    setVehicleNumber(e.target.value);
                    setErrors(prev => ({ ...prev, vehicleNumber: '' }));
                  }}
                  error={errors.vehicleNumber}
                  placeholder="e.g. RJ-14-GA-1234"
                />
                <Input
                  label={t('dispatches.dispatchNo')}
                  value={gatePassNumber}
                  onChange={e => setGatePassNumber(e.target.value)}
                  placeholder="Auto-generates if blank"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick info panel */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Truck className="w-5 h-5" />
                  {t('dispatches.transportLogistics')}
                </div>
                <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                  <li>Ensure vehicle driver details match the gate pass information.</li>
                  <li>Verify that items are securely packed before marking loading as completed.</li>
                  <li>Confirm godown stock matches requested loading quantities.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dispatch items card */}
        {dispatchItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('dispatches.dispatchedItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Item Details</th>
                      <th className="p-4 text-center">Requested Qty</th>
                      <th className="p-4 text-center">Dispatched Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium">
                    {dispatchItems.map((item, idx) => (
                      <tr key={item.item || idx} className="hover:bg-muted/10">
                        <td className="p-4">
                          <p className="font-bold text-foreground text-sm">{item.name}</p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{item.code}</span>
                        </td>
                        <td className="p-4 text-center font-black text-sm">{item.requestedQty}</td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.requestedQty}
                            value={item.dispatchedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setDispatchItems(dispatchItems.map((di, i) => (i === idx ? { ...di, dispatchedQty: val } : di)));
                            }}
                            disabled={isEditMode && dispatchStatus !== 'Loading'}
                            className="w-20 px-2 py-1.5 border border-border focus:border-primary text-center rounded-md font-bold text-sm bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/logistics/dispatches')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || dispatchItems.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Update Loading Slip' : 'Generate Loading Slip'}
          </Button>
        </div>
      </form>
    </div>
  );
}
