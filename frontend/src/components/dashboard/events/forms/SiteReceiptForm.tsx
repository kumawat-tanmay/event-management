'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, FileSignature, MapPin, AlertTriangle, 
  CheckCircle2, Camera, Clock, Save
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';
import { eventExecutionService } from '@/lib/services/eventExecution.services';
import { toast } from 'react-hot-toast';
import { userService } from '@/lib/services/user.services';
import { PhotoUpload } from '../gallery/PhotoUpload';

export function SiteReceiptForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [condition, setCondition] = useState<'OK' | 'Damaged' | 'Shortage'>('OK');
  const [remarks, setRemarks] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [photos, setPhotos] = useState<(File | string)[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: booking } = useSWR(bookingId ? `/bookings/${bookingId}` : null, () => bookingService.getBookingById(bookingId));
  const { data: users = [] } = useSWR('/users', () => userService.getUsers());

  React.useEffect(() => {
    if (booking?.assignedSupervisor && !supervisorName) {
      const sup = booking.assignedSupervisor;
      const name = typeof sup === 'object' ? sup.name : sup;
      setSupervisorName(name || '');
    }
  }, [booking, supervisorName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    setSubmitting(true);
    try {
      await eventExecutionService.createSiteReceipt({
        bookingId,
        materialCondition: condition,
        remarks,
        supervisorName,
        photos,
      });

      toast.success(t('events.receiptSubmitted', 'Site arrival receipt recorded successfully!'));
      router.push(`/events/list/${bookingId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit site receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const bookingRef = booking?.bookingId || (booking as any)?.bookingNumber || 'BK-2026';
  const venue = booking?.venueAddress || 'Venue Site';

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title={t('events.siteReceipt')} 
            description={`Verify material received at site for ${bookingRef}`}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Delivery Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary font-mono">
                  {bookingRef}
                </span>
                <StatusBadge status="Confirmed" customText={booking?.status || 'Active'} />
              </div>
              <CardTitle className="text-lg font-bold leading-tight">{booking?.eventTitle || 'Event Setup'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{venue}</p>
                  <p className="text-xs text-muted-foreground">Site Address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(() => {
                      if (!booking?.eventStartDate) return 'Today';
                      const d = new Date(booking.eventStartDate);
                      return isNaN(d.getTime()) ? '—' : d.toISOString().split('T')[0];
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">Event Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Receipt Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[450px]">
            <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                {t('events.siteReceipt')}
              </CardTitle>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Receipt'}
              </Button>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6 flex-1">
               {/* Supervisor Name */}
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-foreground">Supervisor Name</label>
                 <select
                   className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                   value={supervisorName}
                   onChange={e => setSupervisorName(e.target.value)}
                 >
                   <option value="">-- Select Supervisor --</option>
                   {users.map((u: any) => (
                     <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                   ))}
                 </select>
               </div>

              {/* Material Condition */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">{t('events.materialCondition')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setCondition('OK')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'OK' ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold text-sm">{t('events.allOk')}</span>
                  </div>
                  <div 
                    onClick={() => setCondition('Damaged')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'Damaged' ? "border-red-500 bg-red-500/10 text-red-600" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-bold text-sm">{t('events.damagedInTransit')}</span>
                  </div>
                  <div 
                    onClick={() => setCondition('Shortage')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'Shortage' ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-bold text-sm">{t('events.shortageMissing')}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  {t('events.remarksDiscrepancies')}
                </label>
                <textarea 
                  className="w-full h-24 p-3 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Describe any issues with the received material at the venue..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Site Setup / Evidence Photos
                </label>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
