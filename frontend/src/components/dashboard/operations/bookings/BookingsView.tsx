'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Eye, Edit, Trash2, Search, Calendar, Users, RefreshCw, FileText } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { bookingService, Booking, BookingStats } from '@/lib/services/booking.services';

export function BookingsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ total: 0, draft: 0, confirmed: 0, planning: 0, inProgress: 0, completed: 0, cancelled: 0, totalValue: 0, totalAdvance: 0, totalBalance: 0 });
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL', 'CONFIRMED', 'INPROGRESS', 'COMPLETED', 'CANCELLED'];

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap: Record<string, string> = {
        CONFIRMED: 'Confirmed',
        INPROGRESS: 'InProgress',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled'
      };
      const statusFilter = activeTab !== 'ALL' ? statusMap[activeTab] : undefined;
      const response = await bookingService.getBookings({
        search: searchQuery || undefined,
        status: statusFilter,
      });
      setData(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const confirmDelete = async () => {
    if (bookingToDelete) {
      try {
        await bookingService.deleteBooking(bookingToDelete);
        await fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
      setDeleteModalOpen(false);
      setBookingToDelete(null);
    }
  };

  const columns = [
    { 
      header: t('bookings.bookingId'), 
      accessorKey: 'bookingId', 
      cell: (row: any) => (
        <span className="font-mono text-sm font-bold text-foreground">
          {row.bookingId}
        </span>
      ) 
    },
    { 
      header: t('bookings.customer'), 
      accessorKey: 'customer', 
      cell: (row: any) => (
        <p className="font-bold text-foreground">{row.customer?.name || '—'}</p>
      ) 
    },
    { 
      header: t('bookings.dates'), 
      accessorKey: 'dates', 
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date(row.eventStartDate).toLocaleDateString()} to {new Date(row.eventEndDate).toLocaleDateString()}</span>
        </div>
      ) 
    },
    { 
      header: t('bookings.venue'), 
      accessorKey: 'venueAddress', 
      cell: (row: any) => (
        <p className="text-sm text-muted-foreground max-w-[200px] truncate">{row.venueAddress}</p>
      ) 
    },
    { 
      header: t('bookings.totalAmount'), 
      accessorKey: 'grandTotal', 
      cell: (row: any) => (
        <span className="font-bold text-foreground">
          ₹ {(row.grandTotal || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.advancePaid'), 
      accessorKey: 'advancePaid', 
      cell: (row: any) => (
        <span className="text-emerald-600 font-semibold">
          ₹ {(row.advancePaid || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.balanceDue'), 
      accessorKey: 'balanceAmount', 
      cell: (row: any) => (
        <span className={`font-bold ${(row.balanceAmount || 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
          ₹ {(row.balanceAmount || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.status'), 
      accessorKey: 'status', 
      cell: (row: any) => {
        let statusKey = 'confirmed';
        if (row.status === 'InProgress') statusKey = 'inProgress';
        if (row.status === 'Completed') statusKey = 'completed';
        if (row.status === 'Cancelled') statusKey = 'cancelled';
        if (row.status === 'Draft') statusKey = 'draft';
        if (row.status === 'Planning') statusKey = 'planning';
        return <StatusBadge status={row.status} customText={t(`bookings.${statusKey}`)} />;
      }
    },
    {
      header: t('bookings.actions'), 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/operations/bookings/${row._id}`} title={t('bookings.viewBooking')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/operations/bookings/${row._id}/edit`} title={t('bookings.editBooking')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" disabled={row.status === 'Cancelled'}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setBookingToDelete(row._id);
              setDeleteModalOpen(true);
            }}
            disabled={row.status === 'Cancelled' || row.status === 'Completed'}
            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
            title={t('crm.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('bookings.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('bookings.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => fetchBookings()} className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/operations/bookings/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('bookings.newBooking')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('bookings.title')}
          value={stats.total}
          icon={Calendar}
          colorTheme="primary"
        />
        <StatsCard
          title={t('bookings.totalAmount')}
          value={`₹${stats.totalValue.toLocaleString()}`}
          icon={FileText}
          colorTheme="blue"
        />
        <StatsCard
          title={t('bookings.advancePayment')}
          value={`₹${stats.totalAdvance.toLocaleString()}`}
          icon={Users}
          colorTheme="success"
        />
        <StatsCard
          title={t('bookings.outstanding')}
          value={`₹${stats.totalBalance.toLocaleString()}`}
          icon={Users}
          colorTheme="warning"
        />
      </div>

      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Calendar className="w-5 h-5 text-primary" />
            {t('bookings.title')}
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
                {tab === 'ALL' ? t('bookings.allBookings') : 
                 tab === 'CONFIRMED' ? t('bookings.confirmed') :
                 tab === 'INPROGRESS' ? t('bookings.inProgress') :
                 tab === 'COMPLETED' ? t('bookings.completed') :
                 t('bookings.cancelled')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('bookings.searchBookings')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('crm.delete')}
        message="Are you sure you want to cancel/remove this event booking?"
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
