'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Truck, CheckCircle2, MapPin, User, Phone, ClipboardList, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import useSWR from 'swr';
import { dispatchService } from '@/lib/services/dispatch.services';
import { toast } from 'react-hot-toast';

export function DispatchDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const dispatchId = params?.id as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: dispatch, error, isLoading, mutate } = useSWR(
    dispatchId ? `/dispatches/${dispatchId}` : null,
    () => dispatchService.getDispatchById(dispatchId)
  );

  const handleStatusUpdate = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      await dispatchService.updateDispatchStatus(dispatchId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await dispatchService.deleteDispatch(dispatchId);
      toast.success('Dispatch deleted successfully!');
      router.push('/logistics/dispatches');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete dispatch');
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (error || !dispatch) return <div className="p-8 text-center text-error">Failed to load dispatch details.</div>;

  const bookingRef = dispatch.bookingId?.bookingId || dispatch.bookingId?.bookingNumber || '—';
  let statusBadgeType = 'Pending';
  if (dispatch.status === 'In-Transit') statusBadgeType = 'In Progress';
  if (dispatch.status === 'Delivered') statusBadgeType = 'Confirmed';

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/logistics/dispatches')}
            className="shrink-0 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{dispatch.dispatchNumber}</h2>
              <StatusBadge status={statusBadgeType} customText={dispatch.status} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Gate Pass: <span className="font-mono font-bold text-primary">{dispatch.gatePassNumber || 'No Gate Pass'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => router.push(`/logistics/dispatches/${dispatchId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {t('dispatches.editSlip')}
          </Button>
          {dispatch.status === 'Loading' && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('In-Transit')}
              disabled={isProcessing}
              className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Truck className="w-4 h-4" />
              {t('dispatches.startTransit')}
            </Button>
          )}
          {dispatch.status === 'In-Transit' && (
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('Delivered')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('dispatches.markDelivered')}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            disabled={isProcessing}
            className="flex items-center gap-2 border-error/30 text-error hover:bg-error/10"
          >
            <Trash2 className="w-4 h-4" />
            {t('dispatches.deleteSlip')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                {t('dispatches.dispatchedItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Item Details</th>
                      <th className="p-4 text-center">Dispatched Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium">
                    {dispatch.items?.map((it: any, idx: number) => (
                      <tr key={it._id || idx} className="hover:bg-muted/10">
                        <td className="p-4">
                          <p className="font-bold text-foreground text-sm">{it.name}</p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{it.code}</span>
                        </td>
                        <td className="p-4 text-center font-black text-sm text-primary">{it.dispatchedQty} Units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column details */}
        <div className="space-y-6">
          {/* Dispatch Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                {t('dispatches.transportLogistics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-foreground">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.vehicleNumber')}</span>
                  <span>{dispatch.vehicleNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.driverName')}</span>
                  <span>{dispatch.driverName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.driverPhone')}</span>
                  <span>{dispatch.driverPhone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {t('dispatches.sourceBooking')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-foreground">
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.bookingRef')}</span>
                <span className="font-mono text-sm text-primary">{bookingRef}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.eventTitle')}</span>
                <span>{dispatch.bookingId?.eventTitle || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.godownSource')}</span>
                <span>{dispatch.warehouseId?.name || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.createdBy')}</span>
                <span>{dispatch.createdBy?.name || 'System'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.dispatchedDate')}</span>
                <span>{new Date(dispatch.dispatchedAt).toLocaleString()}</span>
              </div>
              {dispatch.deliveredAt && (
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('dispatches.deliveredDate')}</span>
                  <span>{new Date(dispatch.deliveredAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('dispatches.deleteConfirmTitle')}
        message={t('dispatches.deleteConfirmMsg')}
        confirmText={t('dispatches.deleteSlip')}
      />
    </div>
  );
}
