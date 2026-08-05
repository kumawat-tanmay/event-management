'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Edit, MapPin,
  CalendarDays, User, CheckCircle2,
  Box, Images, ClipboardList, Info, FileCheck, RotateCcw, Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import useSWR from 'swr';
import { bookingService } from '@/lib/services/booking.services';
import { eventExecutionService } from '@/lib/services/eventExecution.services';
import { userService } from '@/lib/services/user.services';
import { dispatchService } from '@/lib/services/dispatch.services';
import { PhotoUpload } from '../gallery/PhotoUpload';
import { toast } from 'react-hot-toast';

export function EventDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [photos, setPhotos] = useState<(File | string)[]>([]);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [savingPhotos, setSavingPhotos] = useState(false);

  const { data: booking, isLoading } = useSWR(
    bookingId ? `/bookings/${bookingId}` : null,
    () => bookingService.getBookingById(bookingId)
  );

  const { data: users = [] } = useSWR('/users', () => userService.getUsers());

  const { data: executions = [], mutate: mutateExecutions } = useSWR(
    bookingId ? `/event-execution/booking/${bookingId}` : null,
    () => eventExecutionService.getExecutionsByBooking(bookingId)
  );

  const { data: dispatches = [] } = useSWR(
    bookingId ? `/dispatches?bookingId=${bookingId}` : null,
    () => dispatchService.getDispatches({ bookingId })
  );

  React.useEffect(() => {
    if (booking?.assignedSupervisor && !supervisorName) {
      const sup = booking.assignedSupervisor;
      const name = typeof sup === 'object' ? sup.name : sup;
      setSupervisorName(name || '');
    }
  }, [booking, supervisorName]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/verification/')) {
      setActiveTab('GALLERY');
    }
  }, []);

  const handleSaveVerificationPhotos = async () => {
    if (!bookingId) return;
    setSavingPhotos(true);
    try {
      await eventExecutionService.createSiteVerification({
        bookingId,
        remarks: verificationRemarks,
        photos,
        supervisorName,
      });
      toast.success(t('events.verificationSubmitted', 'Pre-event verification and photos saved!'));
      setPhotos([]);
      setVerificationRemarks('');
      mutateExecutions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save photos');
    } finally {
      setSavingPhotos(false);
    }
  };

  const timelineItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      title: string;
      type: 'BOOKING' | 'DISPATCH' | 'RECEIPT' | 'VERIFICATION' | 'RETURN';
      status?: string;
      details: React.ReactNode;
    }> = [];

    if (booking) {
      items.push({
        id: 'booking-created',
        date: booking.createdAt || new Date().toISOString(),
        title: 'Booking Confirmed',
        type: 'BOOKING',
        details: (
          <p className="text-xs text-muted-foreground">
            Booking event created for <strong className="text-foreground">{booking.eventTitle}</strong>.
          </p>
        ),
      });
    }

    dispatches.forEach((d: any) => {
      items.push({
        id: d._id,
        date: d.dispatchedAt || d.createdAt,
        title: `Dispatch Created (${d.dispatchNumber})`,
        type: 'DISPATCH',
        status: d.status,
        details: (
          <div className="space-y-1 mt-1 text-[11px]">
            <p className="text-muted-foreground">
              Vehicle: <strong className="text-foreground">{d.vehicleNumber}</strong> | Driver: <strong className="text-foreground">{d.driverName} ({d.driverPhone})</strong>
            </p>
            <p className="text-muted-foreground">
              Dispatched Items: <span className="font-bold text-foreground">{d.items?.length || 0} items loaded</span>
            </p>
          </div>
        ),
      });
    });

    const executionsList = Array.isArray(executions) ? executions : (executions?.data || []);
    executionsList.forEach((ex: any) => {
      let title = '';
      let type: 'RECEIPT' | 'VERIFICATION' | 'RETURN' = 'RECEIPT';
      let details: React.ReactNode = null;

      if (ex.type === 'SiteReceipt') {
        type = 'RECEIPT';
        title = 'Site Arrival Receipt';
        details = (
          <div className="space-y-1 mt-1 text-[11px]">
            <p className="text-muted-foreground">
              Condition: <strong className={ex.materialCondition === 'OK' ? 'text-emerald-600' : 'text-amber-600'}>{ex.materialCondition}</strong>
            </p>
            {ex.supervisorName && <p className="text-muted-foreground">Supervisor: <strong className="text-foreground">{ex.supervisorName}</strong></p>}
            {ex.remarks && <p className="text-foreground italic bg-muted/40 p-1.5 rounded border border-border">"{ex.remarks}"</p>}
            {ex.photos && ex.photos.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {ex.photos.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt="Receipt photo" className="w-12 h-12 object-cover rounded border border-border shrink-0" />
                ))}
              </div>
            )}
          </div>
        );
      } else if (ex.type === 'Verification') {
        type = 'VERIFICATION';
        title = 'Pre-Event Verification';
        details = (
          <div className="space-y-1 mt-1 text-[11px]">
            {ex.supervisorName && <p className="text-muted-foreground">Inspector: <strong className="text-foreground">{ex.supervisorName}</strong></p>}
            {ex.remarks && <p className="text-foreground italic bg-muted/40 p-1.5 rounded border border-border">"{ex.remarks}"</p>}
            {ex.photos && ex.photos.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {ex.photos.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt="Verification photo" className="w-12 h-12 object-cover rounded border border-border shrink-0" />
                ))}
              </div>
            )}
          </div>
        );
      } else if (ex.type === 'Return') {
        type = 'RETURN';
        title = 'Post-Event Return & Settle';
        details = (
          <div className="space-y-1 mt-1 text-[11px]">
            {ex.supervisorName && <p className="text-muted-foreground">Settled By: <strong className="text-foreground">{ex.supervisorName}</strong></p>}
            {ex.remarks && <p className="text-foreground italic bg-muted/40 p-1.5 rounded border border-border">"{ex.remarks}"</p>}
            {ex.returnItems && ex.returnItems.length > 0 && (
              <div className="border border-border rounded overflow-hidden max-w-md mt-1">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-muted border-b border-border text-muted-foreground uppercase font-black font-sans">
                      <th className="p-1">Item</th>
                      <th className="p-1 text-center text-emerald-600">Good</th>
                      <th className="p-1 text-center text-amber-600">Damaged</th>
                      <th className="p-1 text-center text-red-600">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.returnItems.map((it: any, index: number) => (
                      <tr key={index} className="border-b border-border divide-x divide-border">
                        <td className="p-1 font-bold text-foreground">{it.name}</td>
                        <td className="p-1 text-center font-bold text-emerald-600">{it.returnedGoodQty}</td>
                        <td className="p-1 text-center font-bold text-amber-600">{it.returnedDamagedQty}</td>
                        <td className="p-1 text-center font-bold text-red-600">{it.missingQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {ex.photos && ex.photos.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {ex.photos.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt="Return photo" className="w-12 h-12 object-cover rounded border border-border shrink-0" />
                ))}
              </div>
            )}
          </div>
        );
      }

      items.push({
        id: ex._id,
        date: ex.createdAt,
        title,
        type,
        details,
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [booking, dispatches, executions]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (!booking) return <div className="p-8 text-center text-error">Booking event not found.</div>;

  const bookingRef = booking.bookingId || (booking as any).bookingNumber || 'BK-2026';
  const customerName = typeof booking.customer === 'object' ? booking.customer?.name : 'Customer';
  const customerPhone = typeof booking.customer === 'object' ? booking.customer?.phone : '—';
  let badgeType = 'Pending';
  if (booking.status === 'Confirmed' || booking.status === 'InProgress') badgeType = 'In Progress';
  if (booking.status === 'Completed' || (booking as any).status === 'Returned') badgeType = 'Confirmed';

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader
            title={booking.eventTitle || 'Event Execution'}
            description={`Manage site receipts, photos, and return settlement for ${bookingRef}`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/operations/bookings/${bookingId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Booking
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {bookingRef}
                </span>
                <StatusBadge status={badgeType} customText={booking.status} />
              </div>
              <CardTitle className="text-xl font-bold leading-tight">{booking.eventTitle || 'Event Execution'}</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {/* Dates */}
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(() => {
                      const formatDate = (dateStr: any) => {
                        if (!dateStr) return '—';
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? '—' : d.toISOString().split('T')[0];
                      };
                      return `${formatDate(booking.eventStartDate)} to ${formatDate(booking.eventEndDate)}`;
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">Event Schedule</p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{booking.venueAddress || 'Venue Site'}</p>
                  <p className="text-xs text-muted-foreground">Venue Location</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Details</p>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{customerName}</p>
                    <p className="text-xs text-muted-foreground">{customerPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Site Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-bold"
                onClick={() => router.push(`/events/receipt/${bookingId}`)}
              >
                <FileCheck className="w-4 h-4 mr-2 text-primary" />
                Site Arrival Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-bold animate-pulse hover:animate-none"
                onClick={() => setActiveTab('GALLERY')}
              >
                <Images className="w-4 h-4 mr-2 text-primary" />
                Site Pre-Event Verification
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-bold"
                onClick={() => router.push(`/events/return/${bookingId}`)}
              >
                <RotateCcw className="w-4 h-4 mr-2 text-primary" />
                Process Stock Return & Settlement
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <div className="border-b border-border flex items-center overflow-x-auto p-2 shrink-0 no-scrollbar">
              {['OVERVIEW', 'MATERIALS', 'GALLERY', 'HISTORY'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 shrink-0 ${activeTab === tab
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                >
                  {tab === 'OVERVIEW' && <Info className="w-4 h-4" />}
                  {tab === 'MATERIALS' && <Box className="w-4 h-4" />}
                  {tab === 'GALLERY' && <Images className="w-4 h-4" />}
                  {tab === 'HISTORY' && <ClipboardList className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            <CardContent className="pt-6 flex-1">
              {/* OVERVIEW TAB */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      Event Execution Summary
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Grand Total: <strong className="text-foreground font-mono">₹{(booking.grandTotal || 0).toLocaleString('en-IN')}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Advance Paid: <strong className="text-emerald-600 font-mono">₹{(booking.advancePaid || 0).toLocaleString('en-IN')}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Balance Outstanding: <strong className="text-amber-600 font-mono">₹{((booking.grandTotal || 0) - (booking.advancePaid || 0)).toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MATERIALS TAB */}
              {activeTab === 'MATERIALS' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Booked Infrastructure & Equipment Items</h3>
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 font-black text-muted-foreground uppercase">
                          <th className="p-3">Item</th>
                          <th className="p-3 text-center">Booked Qty</th>
                          <th className="p-3 text-right">Daily Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium text-foreground">
                        {booking.items?.map((it: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/10">
                            <td className="p-3">
                              <p className="font-bold text-foreground">{it.itemName || it.name}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">{it.itemCode || it.code}</span>
                            </td>
                            <td className="p-3 text-center font-black">{it.quantity || it.qty}</td>
                            <td className="p-3 text-right font-bold">₹{it.rentalPrice || it.rate || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'GALLERY' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Upload Site Verification Photos</h3>
                    <p className="text-xs text-muted-foreground mb-4">Upload pre-event setup photos, stage layout proofs, and venue inspection shots.</p>
                    <PhotoUpload photos={photos} onChange={setPhotos} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Supervisor / Inspector</label>
                      <select
                        className="w-full h-10 px-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                        value={supervisorName}
                        onChange={e => setSupervisorName(e.target.value)}
                      >
                        <option value="">-- Select Supervisor --</option>
                        {users.map((u: any) => (
                          <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Verification Notes</label>
                      <input
                        type="text"
                        className="w-full h-10 px-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Add layout observations, power supply notes..."
                        value={verificationRemarks}
                        onChange={e => setVerificationRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveVerificationPhotos}
                    disabled={savingPhotos || photos.length === 0}
                  >
                    {savingPhotos ? 'Saving...' : 'Save Site Verification Photos'}
                  </Button>
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'HISTORY' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-foreground">Complete Event Process History</h3>

                  {timelineItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No process logs recorded yet.</p>
                  ) : (
                    <div className="relative border-l border-border pl-6 ml-3 space-y-8 py-2">
                      {timelineItems.map((item) => {
                        let icon = <ClipboardList className="w-4 h-4" />;
                        let colorClass = 'bg-primary text-primary-foreground';

                        if (item.type === 'BOOKING') {
                          icon = <CalendarDays className="w-4 h-4" />;
                          colorClass = 'bg-blue-500 text-white';
                        } else if (item.type === 'DISPATCH') {
                          icon = <Truck className="w-4 h-4" />;
                          colorClass = 'bg-amber-500 text-white';
                        } else if (item.type === 'RECEIPT') {
                          icon = <FileCheck className="w-4 h-4" />;
                          colorClass = 'bg-teal-500 text-white';
                        } else if (item.type === 'VERIFICATION') {
                          icon = <Images className="w-4 h-4" />;
                          colorClass = 'bg-emerald-500 text-white';
                        } else if (item.type === 'RETURN') {
                          icon = <RotateCcw className="w-4 h-4" />;
                          colorClass = 'bg-red-500 text-white';
                        }

                        return (
                          <div key={item.id} className="relative">
                            {/* Marker Icon */}
                            <span className={`absolute -left-[34px] top-0 rounded-full p-1.5 border border-background shadow-sm ${colorClass}`}>
                              {icon}
                            </span>

                            {/* Content */}
                            <div className="space-y-1 bg-muted/20 p-3 rounded-lg border border-border">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="font-bold text-foreground text-xs">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {new Date(item.date).toLocaleString()}
                                </span>
                              </div>
                              {item.details}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
