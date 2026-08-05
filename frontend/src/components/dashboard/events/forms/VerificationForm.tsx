'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, MapPin, CalendarDays, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';

export function VerificationForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: bookingsRaw, isLoading, mutate } = useSWR('/bookings', () => bookingService.getBookings());
  const bookings: any[] = Array.isArray(bookingsRaw?.data) ? bookingsRaw.data : (Array.isArray(bookingsRaw) ? (bookingsRaw as any) : []);

  const activeBookings = bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'InProgress' || b.status === 'Stock Locked');

  const columns = [
    {
      header: 'Event Details',
      accessorKey: 'eventTitle',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-sm">{row.eventTitle || 'Event Setup'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-primary">{row.bookingId || row.bookingNumber}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{row.venueAddress || 'Venue Site'}</span>
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Client / Party',
      accessorKey: 'customer.name',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-sm">{typeof row.customer === 'object' ? row.customer?.name : 'Customer'}</p>
          <p className="text-xs text-muted-foreground">{row.eventType || 'Event'}</p>
        </div>
      )
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
          <div className="flex items-center text-xs text-foreground font-semibold">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
            {formatDate(row.eventStartDate)} to {formatDate(row.eventEndDate)}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        let badgeType = 'Pending';
        if (row.status === 'Confirmed' || row.status === 'InProgress') badgeType = 'In Progress';
        if (row.status === 'Returned' || row.status === 'Completed') badgeType = 'Confirmed';
        return <StatusBadge status={badgeType} customText={row.status} />;
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            size="sm"
            className="bg-[#5C3A21] hover:bg-[#6B4627] text-white font-bold flex items-center gap-1.5"
            onClick={() => router.push(`/events/verification/${row._id}`)}
          >
            <span>Verify Site</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Site Verification & Photos</h2>
          <p className="text-sm font-medium text-muted-foreground">Verify site readiness, stage dimensions, power setup, and client photo proofs.</p>
        </div>
        <Button variant="outline" onClick={() => mutate()} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <StatsCard
          title={t('events.pendingVerification')}
          value={activeBookings.length}
          icon={ShieldCheck}
          subtitle="Action Needed"
          colorTheme="primary"
        />
        <StatsCard
          title={t('events.inProgress')}
          value={bookings.filter((b: any) => b.status === 'InProgress').length}
          icon={AlertTriangle}
          subtitle="Active Sites"
          colorTheme="yellow"
        />
        <StatsCard
          title={t('events.completed')}
          value={bookings.filter((b: any) => b.status === 'Returned' || b.status === 'Completed').length}
          icon={CheckCircle2}
          subtitle="Verified & Settled"
          colorTheme="success"
        />
      </div>

      {/* Verification List Table */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Venue Setup Sites</h3>
        </div>

        {activeBookings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold">No Active Sites Pending Verification</p>
            <p className="text-xs mt-1">Confirmed event bookings will automatically show up here for pre-event inspection.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              data={activeBookings}
              className="p-0 border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
