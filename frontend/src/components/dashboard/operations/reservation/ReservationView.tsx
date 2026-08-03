'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, RefreshCw, AlertTriangle, Layers, Grid, Eye } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { WarehouseAvailability } from './WarehouseAvailability';
import useSWR from 'swr';
import { reservationService } from '@/lib/services/reservation.services';

export function ReservationView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailabilityGrid, setShowAvailabilityGrid] = useState(false);

  const { data: reservations = [], isLoading, mutate } = useSWR(
    '/reservations',
    reservationService.getAllReservations
  );

  const tabs = ['ALL', 'PENDING', 'AUTO-SPLIT', 'LOCKED', 'RELEASED'];

  // Flatten the item names for display, as reservation holds multiple items
  const formattedData = reservations.map((r: any) => ({
    id: r._id,
    bookingRef: typeof r.bookingId === 'object' ? (r.bookingId?.bookingId || r.bookingId?._id) : r.bookingId,
    bookingObjectId: typeof r.bookingId === 'object' ? r.bookingId?._id : r.bookingId,
    customerName: r.customer?.name || 'Unknown',
    itemName: r.items.length > 0 ? `${r.items[0].name} ${r.items.length > 1 ? `+${r.items.length - 1} more` : ''}` : 'No items',
    quantity: r.items.reduce((acc: number, item: any) => acc + item.requestedQty, 0),
    dates: `${new Date(r.eventStartDate).toISOString().split('T')[0]} to ${new Date(r.eventEndDate).toISOString().split('T')[0]}`,
    status: r.status,
    splitAllocated: r.status === 'Locked' || r.status === 'Partially Released'
  }));

  const filteredData = formattedData.filter((r: any) => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.bookingRef || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab !== 'ALL') {
      matchesTab = r.status.toUpperCase() === activeTab.replace('-', ' ');
    }

    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: 'Booking ID',
      accessorKey: 'bookingRef',
      cell: (row: any) => <span className="font-mono text-sm font-bold text-foreground">{row.bookingRef}</span>
    },
    {
      header: t('bookings.customer'),
      accessorKey: 'customerName',
      cell: (row: any) => <p className="font-bold text-foreground">{row.customerName}</p>
    },
    {
      header: t('reservation.item'),
      accessorKey: 'itemName',
      cell: (row: any) => <p className="text-sm font-semibold text-foreground">{row.itemName}</p>
    },
    {
      header: 'Total Qty',
      accessorKey: 'quantity',
      cell: (row: any) => <span className="font-bold text-foreground">{row.quantity}</span>
    },
    {
      header: t('reservation.dates'),
      accessorKey: 'dates',
      cell: (row: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{row.dates}</span>
        </div>
      )
    },
    {
      header: 'Godown Split',
      accessorKey: 'splitAllocated',
      cell: (row: any) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.splitAllocated 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-amber-100 text-amber-800'
        }`}>
          {row.splitAllocated ? 'Allocated' : 'Pending Split'}
        </span>
      )
    },
    {
      header: t('reservation.status'),
      accessorKey: 'status',
      cell: (row: any) => {
        let badgeType = 'Pending';
        if (row.status === 'Auto-Split' || row.status === 'Locked') badgeType = 'Confirmed';
        if (row.status === 'Released') badgeType = 'Cancelled';
        return <StatusBadge status={badgeType} customText={row.status} />;
      }
    },
    {
      header: t('bookings.actions'),
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/operations/bookings/${row.bookingObjectId}`} title="View Booking Detail">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/operations/reservation/${row.bookingObjectId}`} title="Manage Split Allocation">
            <Button variant="ghost" size="sm" className="h-8 flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors">
              <Layers className="w-4 h-4" />
              Split Alloc
            </Button>
          </Link>
        </div>
      )
    }
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('reservation.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('reservation.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowAvailabilityGrid(!showAvailabilityGrid)} className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            {showAvailabilityGrid ? 'Hide Availability Grid' : 'Show Availability Grid'}
          </Button>
          <Button variant="outline" onClick={() => mutate()} className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {showAvailabilityGrid && (
        <div className="mb-8">
          <WarehouseAvailability />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Reservations"
          value={formattedData.length}
          icon={Layers}
          colorTheme="primary"
        />
        <StatsCard
          title="Pending Locks"
          value={formattedData.filter((r: any) => r.status === 'Pending').length}
          icon={Calendar}
          colorTheme="blue"
        />
        <StatsCard
          title="Fully Locked"
          value={formattedData.filter((r: any) => r.status === 'Locked').length}
          icon={RefreshCw}
          colorTheme="success"
        />
        <StatsCard
          title="Conflicts"
          value={0}
          icon={AlertTriangle}
          colorTheme="error"
        />
      </div>

      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Layers className="w-5 h-5 text-primary" />
            {t('reservation.allReservations')}
          </div>
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'ALL' ? t('reservation.allReservations') : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('reservation.searchReservations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredData}
          />
        </div>
      </div>
    </div>
  );
}
