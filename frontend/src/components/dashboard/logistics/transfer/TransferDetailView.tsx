'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RotateCcw, ArrowRight, Building2, CheckCircle2, User, Calendar, ClipboardList, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import useSWR from 'swr';
import { warehouseTransferService } from '@/lib/services/warehouseTransfer.services';
import { toast } from 'react-hot-toast';

export function TransferDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const transferId = params?.id as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: transfer, error, isLoading, mutate } = useSWR(
    transferId ? `/warehouse-transfers/${transferId}` : null,
    () => warehouseTransferService.getTransferById(transferId)
  );

  const handleShip = async () => {
    setIsProcessing(true);
    try {
      await warehouseTransferService.approveTransfer(transferId);
      toast.success('Stock transfer approved and shipped!');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to ship transfer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceive = async () => {
    setIsProcessing(true);
    try {
      await warehouseTransferService.receiveTransfer(transferId);
      toast.success('Stock received at destination godown!');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to receive transfer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await warehouseTransferService.deleteTransfer(transferId);
      toast.success('Stock Transfer deleted successfully!');
      router.push('/logistics/transfer');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete transfer');
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (error || !transfer) return <div className="p-8 text-center text-error">Failed to load transfer details.</div>;

  let statusBadgeType = 'Pending';
  if (transfer.status === 'In-Transit') statusBadgeType = 'In Progress';
  if (transfer.status === 'Received') statusBadgeType = 'Confirmed';
  if (transfer.status === 'Rejected') statusBadgeType = 'Lost';

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/logistics/transfer')}
            className="shrink-0 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{transfer.transferNumber}</h2>
              <StatusBadge status={statusBadgeType} customText={transfer.status} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Inter-Godown Asset Transfer Request
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => router.push(`/logistics/transfer/${transferId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {t('transfer.editTransfer')}
          </Button>
          {transfer.status === 'Requested' && (
            <Button
              variant="outline"
              onClick={handleShip}
              disabled={isProcessing}
              className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="w-4 h-4" />
              {t('transfer.ship')}
            </Button>
          )}
          {transfer.status === 'In-Transit' && (
            <Button
              variant="primary"
              onClick={handleReceive}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('transfer.receive')}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            disabled={isProcessing}
            className="flex items-center gap-2 border-error/30 text-error hover:bg-error/10"
          >
            <Trash2 className="w-4 h-4" />
            {t('transfer.deleteTransfer')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                {t('transfer.transferItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Item Details</th>
                      <th className="p-4 text-center">Transferred Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium">
                    {transfer.items?.map((it: any, idx: number) => {
                      const itemObj = typeof it.item === 'object' ? it.item : null;
                      const name = it.name || itemObj?.name || 'Item';
                      const code = it.code || itemObj?.code || '—';
                      const qty = it.qty || it.quantity || 0;

                      return (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-4">
                            <p className="font-bold text-foreground text-sm">{name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{code}</span>
                          </td>
                          <td className="p-4 text-center font-black text-sm text-primary">{qty} Units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {transfer.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  {t('transfer.remarks')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground bg-muted/20 p-3 rounded-lg border border-border">{transfer.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column Details */}
        <div className="space-y-6">
          {/* Transfer Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Transfer Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-foreground">
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('transfer.sourceGodown')}</span>
                <span className="text-sm font-bold text-foreground">{transfer.fromWarehouse?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-center my-2 text-primary">
                <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('transfer.destGodown')}</span>
                <span className="text-sm font-bold text-foreground">{transfer.toWarehouse?.name || '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {t('transfer.transferDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-foreground">
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t('transfer.requestedBy')}</span>
                <span>{transfer.requestedBy?.name || 'System'}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">Requested Date</span>
                <span>{new Date(transfer.createdAt).toLocaleString()}</span>
              </div>
              {transfer.shippedAt && (
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Shipped Date</span>
                  <span>{new Date(transfer.shippedAt).toLocaleString()}</span>
                </div>
              )}
              {transfer.receivedAt && (
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Received Date</span>
                  <span>{new Date(transfer.receivedAt).toLocaleString()}</span>
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
        title={t('transfer.deleteConfirmTitle')}
        message={t('transfer.deleteConfirmMsg')}
        confirmText={t('transfer.deleteTransfer')}
      />
    </div>
  );
}
