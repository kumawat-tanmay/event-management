'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Truck, Plus, Search, RefreshCw, CheckCircle2, Clock, MapPin, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import useSWR from 'swr';
import { dispatchService } from '@/lib/services/dispatch.services';
import { toast } from 'react-hot-toast';

export function DispatchesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: dispatches = [], isLoading, mutate } = useSWR('/dispatches', () => dispatchService.getDispatches());

  const tabs = ['ALL', 'LOADING', 'IN-TRANSIT', 'DELIVERED'];

  const filteredDispatches = dispatches.filter((d: any) => {
    const matchesSearch =
      (d.dispatchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.gatePassNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab !== 'ALL') {
      matchesTab = (d.status || '').toUpperCase() === activeTab;
    }
    return matchesSearch && matchesTab;
  });

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await dispatchService.updateDispatchStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const confirmDeleteDispatch = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatchService.deleteDispatch(deleteTargetId);
      toast.success('Dispatch deleted successfully!');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete dispatch');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const columns = [
    {
      header: t('dispatches.dispatchNo'),
      accessorKey: 'dispatchNumber',
      cell: (row: any) => (
        <div>
          <span className="font-mono text-sm font-bold text-foreground block">{row.dispatchNumber}</span>
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold inline-block mt-0.5">
            {row.gatePassNumber || 'No Gate Pass'}
          </span>
        </div>
      ),
    },
    {
      header: t('dispatches.bookingEvent'),
      accessorKey: 'bookingId',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-sm">{row.bookingId?.bookingId || row.bookingId?.bookingNumber || 'BK-2026'}</p>
          <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{row.bookingId?.eventTitle || 'Event Setup'}</span>
        </div>
      ),
    },
    {
      header: t('dispatches.godownSource'),
      accessorKey: 'warehouseId',
      cell: (row: any) => <span className="font-semibold text-foreground text-xs">{row.warehouseId?.name || 'Main Warehouse'}</span>,
    },
    {
      header: t('dispatches.transportDriver'),
      accessorKey: 'driverName',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-xs">{row.driverName} ({row.vehicleNumber})</p>
          <span className="text-[11px] text-muted-foreground">{row.driverPhone}</span>
        </div>
      ),
    },
    {
      header: t('dispatches.status'),
      accessorKey: 'status',
      cell: (row: any) => {
        let statusType = 'Pending';
        if (row.status === 'In-Transit') statusType = 'In Progress';
        if (row.status === 'Delivered') statusType = 'Confirmed';
        return <StatusBadge status={statusType} customText={row.status} />;
      },
    },
    {
      header: t('dispatches.actions'),
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/logistics/dispatches/${row._id}`)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-primary"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/logistics/dispatches/${row._id}/edit`)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-primary"
            title="Edit Dispatch"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteTargetId(row._id)}
            className="h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-error"
            title="Delete Dispatch"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {row.status === 'Loading' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(row._id, 'In-Transit')} className="h-7 text-xs font-bold text-blue-600">
              {t('dispatches.startTransit')}
            </Button>
          )}
          {row.status === 'In-Transit' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(row._id, 'Delivered')} className="h-7 text-xs font-bold text-emerald-600">
              {t('dispatches.markDelivered')}
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('dispatches.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('dispatches.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => mutate()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => router.push('/logistics/dispatches/new')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('dispatches.newDispatch')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard title={t('dispatches.totalDispatches')} value={dispatches.length} icon={Truck} colorTheme="primary" />
        <StatsCard title={t('dispatches.loadingInGodown')} value={dispatches.filter((d: any) => d.status === 'Loading').length} icon={Clock} colorTheme="secondary" />
        <StatsCard title={t('dispatches.inTransitTrucks')} value={dispatches.filter((d: any) => d.status === 'In-Transit').length} icon={MapPin} colorTheme="blue" />
        <StatsCard title={t('dispatches.deliveredToSite')} value={dispatches.filter((d: any) => d.status === 'Delivered').length} icon={CheckCircle2} colorTheme="success" />
      </div>

      {/* Data Table Container */}
      <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Truck className="w-5 h-5 text-primary" />
            {t('dispatches.title')}
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
                {tab === 'ALL' ? t('dispatches.allDispatches') : tab === 'LOADING' ? t('dispatches.loading') : tab === 'IN-TRANSIT' ? t('dispatches.inTransit') : t('dispatches.delivered')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('dispatches.searchDispatches')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-auto">
          <DataTable columns={columns} data={filteredDispatches} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteDispatch}
        title={t('dispatches.deleteConfirmTitle')}
        message={t('dispatches.deleteConfirmMsg')}
        confirmText={t('dispatches.deleteSlip')}
      />
    </div>
  );
}
