'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, MapPin, Clock, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';

export function VerificationForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: bookingsRaw, isLoading, mutate } = useSWR('/bookings', () => bookingService.getBookings());
  const bookings: any[] = Array.isArray(bookingsRaw?.data) ? bookingsRaw.data : (Array.isArray(bookingsRaw) ? (bookingsRaw as any) : []);

  const activeBookings = bookings.filter((b: any) => b.status === 'Confirmed' || b.status === 'InProgress' || b.status === 'Stock Locked');

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('events.siteVerification')}</h2>
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

      {/* Grid Layout for Verification Cards */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Active Venue Setup Sites</h3>

        {activeBookings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold">No Active Sites Pending Verification</p>
            <p className="text-xs mt-1">Confirmed event bookings will automatically show up here for pre-event inspection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.map((bk: any) => (
              <Card key={bk._id} className="border-border shadow-sm flex flex-col hover:border-primary/50 transition-colors bg-card">
                <CardHeader className="border-b border-border bg-muted/10 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-primary">{bk.bookingId || bk.bookingNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-warning/10 text-warning">
                      {bk.status}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold leading-tight">
                    {bk.eventTitle || 'Event Setup'}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4 flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{bk.venueAddress || 'Venue Location'}</p>
                      <p className="text-xs text-muted-foreground">Venue Address</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {bk.eventStartDate ? new Date(bk.eventStartDate).toISOString().split('T')[0] : 'Event Date'}
                      </p>
                      <p className="text-xs text-muted-foreground">Event Date</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border p-4 bg-muted/5">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => router.push(`/events/verification/${bk._id}`)}
                  >
                    Verify & Upload Photos
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
