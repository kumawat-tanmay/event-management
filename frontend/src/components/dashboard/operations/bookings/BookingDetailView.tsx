'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Phone, Mail, ArrowLeft, Edit, FileText, Printer, ShieldAlert, CreditCard, MessageSquare, Loader2, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { invoiceService } from '@/lib/services/invoice.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { generatePdfFromHtml, sharePdfViaWhatsApp } from '@/utils/pdfShare';
import { getBookingAgreementPdfHtml } from '@/utils/pdfTemplates';
import useSWR from 'swr';

export function BookingDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Fetch invoices for this booking to check if one exists
  const { data: invoices, isLoading: invoiceLoading } = useSWR(
    booking?._id ? `booking-invoice-${booking._id}` : null,
    () => invoiceService.getInvoices({ bookingId: booking?._id })
  );

  const existingInvoice = invoices?.[0];

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await bookingService.getBookingById(id as string);
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleSendWhatsApp = async () => {
    if (!booking) return;
    
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
      alert("Failed to generate PDF");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (!booking) return <div className="p-8 text-center text-error">Booking not found.</div>;

  let statusKey = 'confirmed';
  if (booking.status === 'InProgress') statusKey = 'inProgress';
  if (booking.status === 'Completed') statusKey = 'completed';
  if (booking.status === 'Cancelled') statusKey = 'cancelled';
  if (booking.status === 'Draft') statusKey = 'draft';
  if (booking.status === 'Planning') statusKey = 'planning';

  const start = new Date(booking.eventStartDate);
  const end = new Date(booking.eventEndDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const itemsTotal = booking.subtotal || 0;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{booking.bookingId}</h2>
              <StatusBadge status={booking.status} customText={t(`bookings.${statusKey}`)} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Booked on {new Date(booking.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {invoiceLoading ? (
            <Button variant="outline" disabled className="flex items-center gap-2 border-border">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span>Checking Invoice...</span>
            </Button>
          ) : existingInvoice ? (
            <Link href={`/finance/invoices/${existingInvoice._id}`}>
              <Button variant="outline" className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <FileText className="w-4 h-4" />
                <span>View Tax Invoice</span>
              </Button>
            </Link>
          ) : (
            <ActionGuard permission="finance.create">
              <Link href={`/finance/invoices/new?bookingId=${booking._id}`}>
                <Button variant="outline" className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <Plus className="w-4 h-4" />
                  <span>Generate Tax Invoice</span>
                </Button>
              </Link>
            </ActionGuard>
          )}

          <ActionGuard permission="bookings.update">
            <Link href={`/operations/bookings/${booking._id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                {t('bookings.editBooking')}
              </Button>
            </Link>
          </ActionGuard>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={handleSendWhatsApp}
          >
            <MessageSquare className="w-4 h-4" />
            Send to WhatsApp
          </Button>

          <Link href={`/operations/bookings/agreement?id=${booking._id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              {t('bookings.printAgreement')}
            </Button>
          </Link>
          <ActionGuard permission="bookings.update">
            <Link href={`/operations/reservation/${booking._id}`}>
              <Button variant="primary" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manage Reservation
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t('bookings.bookingDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase">{t('bookings.dates')}</h4>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {new Date(booking.eventStartDate).toLocaleDateString()} to {new Date(booking.eventEndDate).toLocaleDateString()}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground mt-0.5 block">
                      Duration: {duration} Days
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase">{t('bookings.venue')}</h4>
                    <p className="text-sm font-semibold text-foreground mt-0.5 leading-relaxed">
                      {booking.venueAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase">{t('quotation.customer')}</h4>
                    <p className="text-sm font-bold text-foreground mt-0.5">{booking.customer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ph: {booking.customer?.phone || '—'}</p>
                  </div>
                </div>

                {booking.customer?.email && (
                  <div className="flex gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-muted-foreground uppercase">{t('crm.emailAddress')}</h4>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{booking.customer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Booked Materials & Services</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Item Name</th>
                      <th className="p-4 text-center rounded-r-lg">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {booking.items.map((item: any, i: number) => {
                      const itemObj = typeof item.item === 'object' ? item.item : null;
                      const name = item.itemName || (itemObj as any)?.name || 'Unknown Item';
                      const code = item.itemCode || (itemObj as any)?.code || '—';
                      const rate = item.rentalRate !== undefined ? item.rentalRate : ((item as any).rentalPrice !== undefined ? (item as any).rentalPrice : ((itemObj as any)?.rentalPrice || 0));
                      const qty = item.quantity || 0;
                      const total = item.totalAmount !== undefined ? item.totalAmount : ((item as any).total || 0);

                      return (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="p-4 font-bold text-foreground">
                            {name}
                            <span className="text-xs text-muted-foreground block font-mono">{code}</span>
                          </td>
                          <td className="p-4 text-center font-semibold">{qty} {item.unit || 'pc'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Payments Ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              {itemsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Materials Total</span>
                  <span className="font-semibold text-foreground">₹{itemsTotal.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transport / Car Cost</span>
                <span className="font-semibold text-foreground">₹{(booking.transportCharges || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tent Cost</span>
                <span className="font-semibold text-foreground">₹{(booking.labourCharges || 0).toLocaleString()}</span>
              </div>

              {booking.discount !== undefined && booking.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="font-medium">Discount ({booking.discount}%)</span>
                  <span className="font-bold">- ₹{(((booking.subtotal || 0) + (booking.transportCharges || 0) + (booking.labourCharges || 0)) * booking.discount / 100).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({booking.taxRate || 0}%)</span>
                <span className="font-semibold text-foreground">₹{(booking.taxAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-lg font-black text-foreground">
                <span>Total Amount</span>
                <span>₹{(booking.grandTotal || 0).toLocaleString()}</span>
              </div>

              <div className="border-t border-border pt-4 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    {t('bookings.advancePayment')} (Paid)
                  </span>
                  <span className="font-bold text-emerald-600">₹{(booking.advancePaid || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Advance Required
                  </span>
                  <span className="font-bold text-blue-600">₹{(booking.advanceRequired || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-3.5 text-base font-black text-foreground">
                <span>{t('bookings.balanceDue')}</span>
                <span className={(booking.balanceAmount || 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
                  ₹{(booking.balanceAmount || 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {(booking.balanceAmount || 0) > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-amber-800">Outstanding Balance</h5>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Client has ₹{(booking.balanceAmount || 0).toLocaleString()} remaining to settle. Ensure collection before material dispatch or setup completion.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
