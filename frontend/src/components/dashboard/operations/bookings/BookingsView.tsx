'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Eye, Edit, Trash2, Search, Calendar, Users, RefreshCw, FileText, MessageSquare } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { bookingService, Booking, BookingStats } from '@/lib/services/booking.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import toast from 'react-hot-toast';
import { generatePdfFromHtml, sharePdfViaWhatsApp } from '@/utils/pdfShare';
import { getBookingAgreementPdfHtml } from '@/utils/pdfTemplates';

const STATUS_OPTIONS: Booking['status'][] = ['Draft', 'Planning', 'InProgress', 'Confirmed', 'Completed', 'Cancelled'];

function StatusDropdown({ booking, onStatusChange }: { booking: any, onStatusChange: (id: string, status: Booking['status']) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:opacity-80 transition-opacity">
        <StatusBadge status={booking.status} />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="absolute z-50 top-full right-0 md:left-0 md:right-auto mt-1 w-36 bg-card border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
            {STATUS_OPTIONS.map(s => (
              <div 
                key={s} 
                onClick={() => { onStatusChange(booking._id, s); setIsOpen(false); }}
                className="cursor-pointer hover:bg-muted p-1.5 rounded-lg transition-colors flex items-center justify-center relative z-10"
              >
                <StatusBadge status={s} className="w-full" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

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
  const tabNavRef = React.useRef<HTMLDivElement>(null);
  const tabBtnRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const centerActiveTab = React.useCallback((tab: string) => {
    const container = tabNavRef.current;
    const target = tabBtnRefs.current[tab];
    if (container && target) {
      const scrollLeft = target.offsetLeft - (container.clientWidth / 2) + (target.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, []);

  React.useEffect(() => {
    if (activeTab) {
      const timer = setTimeout(() => {
        centerActiveTab(activeTab);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, centerActiveTab]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings({ limit: 200 });
      setData(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredData = React.useMemo(() => {
    return data.filter(booking => {
      if (activeTab === 'CONFIRMED' && booking.status !== 'Confirmed') return false;
      if (activeTab === 'INPROGRESS' && booking.status !== 'InProgress' && booking.status !== 'Planning') return false;
      if (activeTab === 'COMPLETED' && booking.status !== 'Completed') return false;
      if (activeTab === 'CANCELLED' && booking.status !== 'Cancelled') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const bId = (booking.bookingId || '').toLowerCase();
        const cust = (booking.customer?.name || '').toLowerCase();
        const title = (booking.eventTitle || '').toLowerCase();
        const venue = (booking.venueAddress || '').toLowerCase();
        return bId.includes(q) || cust.includes(q) || title.includes(q) || venue.includes(q);
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  const confirmDelete = async () => {
    if (bookingToDelete) {
      try {
        await bookingService.deleteBooking(bookingToDelete);
        toast.success('Booking and associated financial records deleted successfully');
        await fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
      }
      setDeleteModalOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleSendWhatsApp = async (booking: Booking) => {
    const htmlContent = getBookingAgreementPdfHtml(booking);
    const filename = `Agreement_${booking.bookingId}.pdf`;
    const customerPhone = booking.customer?.phone || '';
    
    const message = `🏕️ *Krishna Tent & Events*

Dear ${booking.customer?.name || 'Customer'},

Please find attached your *Rental Agreement #${booking.bookingId}* for the event:
📋 *${booking.eventTitle}*
📅 ${new Date(booking.eventStartDate).toLocaleDateString()} to ${new Date(booking.eventEndDate).toLocaleDateString()}
📍 ${booking.venueAddress}
💰 Grand Total: ₹${(booking.grandTotal || 0).toLocaleString()}
✅ Advance Paid: ₹${(booking.advancePaid || 0).toLocaleString()}
📝 Balance Due: ₹${(booking.balanceAmount || 0).toLocaleString()}

Thank you for choosing Krishna Tent & Events!
📞 +91 98290 12345`;

    const blob = await generatePdfFromHtml(htmlContent, filename);
    if (blob) {
      await sharePdfViaWhatsApp(blob, filename, customerPhone, message);
    } else {
      toast.error("Failed to generate PDF");
    }
  };

  const columns = [
    { 
      header: t('bookings.bookingId'), 
      accessorKey: 'bookingId', 
      cell: (row: any) => (
        <span className="font-mono text-sm font-bold text-foreground whitespace-nowrap">
          {row.bookingId}
        </span>
      ) 
    },
    { 
      header: t('bookings.customer'), 
      accessorKey: 'customer', 
      cell: (row: any) => (
        <p className="font-bold text-foreground whitespace-nowrap max-w-[150px] truncate" title={row.customer?.name}>{row.customer?.name || '—'}</p>
      ) 
    },
    { 
      header: t('bookings.dates'), 
      accessorKey: 'dates', 
      cell: (row: any) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          <span>{new Date(row.eventStartDate).toLocaleDateString()} - {new Date(row.eventEndDate).toLocaleDateString()}</span>
        </div>
      ) 
    },
    { 
      header: t('bookings.venue'), 
      accessorKey: 'venueAddress', 
      cell: (row: any) => (
        <p className="text-sm text-muted-foreground max-w-[150px] truncate" title={row.venueAddress}>{row.venueAddress}</p>
      ) 
    },
    { 
      header: t('bookings.totalAmount'), 
      accessorKey: 'grandTotal', 
      cell: (row: any) => (
        <span className="font-bold text-foreground whitespace-nowrap">
          ₹ {(row.grandTotal || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.advancePaid'), 
      accessorKey: 'advancePaid', 
      cell: (row: any) => (
        <span className="text-emerald-600 font-semibold whitespace-nowrap">
          ₹ {(row.advancePaid || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.balanceDue'), 
      accessorKey: 'balanceAmount', 
      cell: (row: any) => (
        <span className={`font-bold whitespace-nowrap ${(row.balanceAmount || 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
          ₹ {(row.balanceAmount || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('bookings.status'), 
      accessorKey: 'status', 
      cell: (row: any) => {
        return (
          <StatusDropdown 
            booking={row} 
            onStatusChange={async (id, newStatus) => {
              try {
                await bookingService.updateBooking(id, { status: newStatus });
                toast.success(`Status updated to ${newStatus}`);
                fetchBookings();
              } catch (error) {
                toast.error('Failed to update status');
              }
            }} 
          />
        );
      }
    },
    {
      header: t('bookings.actions'), 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <Link href={`/operations/bookings/${row._id}`} title={t('bookings.viewBooking')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleSendWhatsApp(row)}
            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Send PDF to WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <ActionGuard permission="bookings.update">
            <Link href={`/operations/bookings/${row._id}/edit`} title={t('bookings.editBooking')}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" disabled={row.status === 'Cancelled'}>
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>
          <ActionGuard permission="bookings.delete">
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
          </ActionGuard>
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
          <ActionGuard permission="bookings.create">
            <Link href="/operations/bookings/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('bookings.newBooking')}</span>
              </Button>
            </Link>
          </ActionGuard>
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
          
          <div
            ref={tabNavRef}
            className="relative flex items-center bg-muted/50 p-1.5 rounded-xl overflow-x-auto flex-nowrap max-w-full md:max-w-md lg:max-w-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                ref={(el) => {
                  tabBtnRefs.current[tab] = el;
                }}
                onClick={() => {
                  setActiveTab(tab);
                  centerActiveTab(tab);
                }}
                className={`px-4 py-1.5 text-xs font-black transition-all rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
            data={filteredData}
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
