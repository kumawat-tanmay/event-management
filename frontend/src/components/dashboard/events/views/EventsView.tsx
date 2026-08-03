'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, Eye, MapPin, CheckCircle2, AlertTriangle, Clock, Search, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';
import { cn } from '@/utils/cn';

export function EventsView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ALL EVENTS');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookingsRaw, isLoading, mutate } = useSWR('/bookings', () => bookingService.getBookings());
  const bookings: any[] = Array.isArray(bookingsRaw?.data) ? bookingsRaw.data : (Array.isArray(bookingsRaw) ? (bookingsRaw as any) : []);

  const tabs = ['ALL EVENTS', 'ACTIVE', 'COMPLETED'];

  const filteredData = bookings.filter((b: any) => {
    const customerName = typeof b.customer === 'object' ? b.customer?.name : '';
    const title = b.eventTitle || '';
    const code = b.bookingId || b.bookingNumber || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'ACTIVE') {
      matchesTab = b.status === 'Confirmed' || b.status === 'InProgress' || b.status === 'Stock Locked';
    } else if (activeTab === 'COMPLETED') {
      matchesTab = b.status === 'Completed' || b.status === 'Returned';
    }
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: 'Event Details',
      accessorKey: 'eventTitle',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground">{row.eventTitle || 'Event Setup'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-primary">{row.bookingId || row.bookingNumber}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate max-w-[200px]">{row.venueAddress || 'Venue Site'}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Client / Party',
      accessorKey: 'customer',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-sm">{typeof row.customer === 'object' ? row.customer?.name : 'Customer'}</p>
          <p className="text-xs text-muted-foreground">{row.eventType || 'Event'}</p>
        </div>
      ),
    },
    {
      header: 'Event Dates',
      accessorKey: 'eventStartDate',
      cell: (row: any) => {
        const formatDate = (dateStr: any) => {
          if (!dateStr) return '—';
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? '—' : d.toISOString().split('T')[0];
        };
        return (
          <div className="flex items-center font-semibold text-xs text-foreground">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
            {formatDate(row.eventStartDate)} to {formatDate(row.eventEndDate)}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        let badgeType = 'Pending';
        if (row.status === 'Confirmed' || row.status === 'InProgress') badgeType = 'In Progress';
        if (row.status === 'Returned' || row.status === 'Completed') badgeType = 'Confirmed';
        return <StatusBadge status={badgeType} customText={row.status} />;
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/events/list/${row._id}`} title="View Event Site Execution">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('events.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('events.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => mutate()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('events.totalEvents')}
          value={bookings.length}
          icon={CalendarDays}
          colorTheme="primary"
        />
        <StatsCard
          title={t('events.inProgress')}
          value={bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'InProgress').length}
          icon={Clock}
          colorTheme="yellow"
        />
        <StatsCard
          title={t('events.pendingVerification')}
          value={bookings.filter((b: any) => b.status === 'InProgress').length}
          icon={AlertTriangle}
          colorTheme="error"
        />
        <StatsCard
          title={t('events.completed')}
          value={bookings.filter((b: any) => b.status === 'Returned' || b.status === 'Completed').length}
          icon={CheckCircle2}
          colorTheme="success"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder={t('events.searchEvents')}
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{t('events.title')}</h3>
              </div>

              <div className="flex items-center justify-center w-full lg:w-1/3">
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit overflow-x-auto max-w-[calc(100vw-2rem)] no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                        activeTab === tab
                          ? "bg-primary text-on-primary shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                      )}
                    >
                      {tab === 'ALL EVENTS' ? t('events.allEvents') : tab === 'ACTIVE' ? t('events.active') : t('events.completed')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full lg:w-1/3 flex justify-end">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('events.searchEvents')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
              </div>
            </div>
          }
          className="border-none shadow-none"
        />
      </div>
    </div>
  );
}
