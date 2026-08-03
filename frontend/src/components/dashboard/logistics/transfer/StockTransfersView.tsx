'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Plus, Search, RefreshCw, ArrowRight, Building2, CheckCircle2, Clock, Truck, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import useSWR from 'swr';
import { warehouseTransferService } from '@/lib/services/warehouseTransfer.services';
import { toast } from 'react-hot-toast';

export function StockTransfersView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: transfers = [], isLoading, mutate } = useSWR('/warehouse-transfers', () => warehouseTransferService.getTransfers());

  const tabs = ['ALL', 'REQUESTED', 'IN-TRANSIT', 'RECEIVED', 'REJECTED'];

  const filteredTransfers = transfers.filter((tr: any) => {
    const matchesSearch =
      (tr.transferNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tr.fromWarehouse?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tr.toWarehouse?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tr.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab !== 'ALL') {
      matchesTab = (tr.status || '').toUpperCase() === activeTab;
    }
    return matchesSearch && matchesTab;
  });

  const handleShip = async (id: string) => {
    try {
      await warehouseTransferService.approveTransfer(id);
      toast.success('Transfer approved and shipped!');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to ship transfer');
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await warehouseTransferService.receiveTransfer(id);
      toast.success('Stock received at destination godown!');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive transfer');
    }
  };

  const confirmDeleteTransfer = async () => {
    if (!deleteTargetId) return;
    try {
      await warehouseTransferService.deleteTransfer(deleteTargetId);
      toast.success('Stock Transfer deleted successfully!');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete transfer');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const columns = [
    {
      header: t('transfer.transferNo'),
      accessorKey: 'transferNumber',
      cell: (row: any) => <span className="font-mono text-sm font-bold text-foreground">{row.transferNumber}</span>,
    },
    {
      header: t('transfer.route'),
      accessorKey: 'fromWarehouse',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-xs">{row.fromWarehouse?.name}</span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground text-xs">{row.toWarehouse?.name}</span>
        </div>
      ),
    },
    {
      header: t('transfer.itemsCount'),
      accessorKey: 'items',
      cell: (row: any) => <span className="font-bold text-xs text-foreground">{row.items?.length || 0} Items</span>,
    },
    {
      header: t('transfer.requestedBy'),
      accessorKey: 'requestedBy',
      cell: (row: any) => <span className="text-muted-foreground text-xs">{row.requestedBy?.name || 'System'}</span>,
    },
    {
      header: t('transfer.status'),
      accessorKey: 'status',
      cell: (row: any) => {
        let statusType = 'Pending';
        if (row.status === 'In-Transit') statusType = 'In Progress';
        if (row.status === 'Received') statusType = 'Confirmed';
        if (row.status === 'Rejected') statusType = 'Lost';
        return <StatusBadge status={statusType} customText={row.status} />;
      },
    },
    {
      header: t('transfer.actions'),
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/logistics/transfer/${row._id}`)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-primary"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/logistics/transfer/${row._id}/edit`)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-primary"
            title="Edit Transfer"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTargetId(row._id)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-error"
            title="Delete Transfer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {row.status === 'Requested' && (
            <Button size="sm" variant="outline" onClick={() => handleShip(row._id)} className="h-7 text-xs font-bold text-blue-600">
              {t('transfer.ship')}
            </Button>
          )}
          {row.status === 'In-Transit' && (
            <Button size="sm" variant="outline" onClick={() => handleReceive(row._id)} className="h-7 text-xs font-bold text-emerald-600">
              {t('transfer.receive')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('transfer.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('transfer.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => mutate()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => router.push('/logistics/transfer/new')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('transfer.newTransfer')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard title={t('transfer.totalTransfers')} value={transfers.length} icon={RotateCcw} colorTheme="primary" />
        <StatsCard title={t('transfer.pending')} value={transfers.filter((t: any) => t.status === 'Requested').length} icon={Clock} colorTheme="secondary" />
        <StatsCard title={t('transfer.inTransit')} value={transfers.filter((t: any) => t.status === 'In-Transit').length} icon={Truck} colorTheme="blue" />
        <StatsCard title={t('transfer.completed')} value={transfers.filter((t: any) => t.status === 'Received').length} icon={CheckCircle2} colorTheme="success" />
      </div>

      {/* Data Table Container */}
      <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Building2 className="w-5 h-5 text-primary" />
            {t('transfer.title')}
          </div>

          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md whitespace-nowrap ${
                  activeTab === tab ? 'bg-primary text-on-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'ALL' ? t('transfer.allTransfers') : tab === 'REQUESTED' ? t('transfer.requested') : tab === 'IN-TRANSIT' ? t('transfer.inTransit') : tab === 'RECEIVED' ? t('transfer.received') : t('transfer.rejected')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('transfer.searchTransfers')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-auto">
          <DataTable columns={columns} data={filteredTransfers} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteTransfer}
        title={t('transfer.deleteConfirmTitle')}
        message={t('transfer.deleteConfirmMsg')}
        confirmText={t('transfer.deleteTransfer')}
      />
    </div>
  );
}
