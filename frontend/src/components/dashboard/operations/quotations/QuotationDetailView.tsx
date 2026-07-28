'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Download, Edit, CheckCircle, FileText, CalendarDays } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { quotationService, Quotation } from '@/lib/services/quotation.services';

export function QuotationDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  const fetchQuotation = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await quotationService.getQuotationById(id as string);
      setQuotation(data);
    } catch (error) {
      console.error('Error fetching quotation detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleConvertToBooking = async () => {
    if (!id) return;
    try {
      const booking = await quotationService.convertToBooking(id as string);
      router.push(`/operations/bookings/${booking._id}`);
    } catch (error) {
      console.error('Error converting quotation to booking:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (!quotation) return <div className="p-8 text-center text-error">Quotation not found</div>;

  let statusKey = 'draft';
  if (quotation.status === 'Sent') statusKey = 'sent';
  if (quotation.status === 'Approved') statusKey = 'approved';
  if (quotation.status === 'Converted') statusKey = 'converted';
  if (quotation.status === 'Rejected') statusKey = 'rejected';

  // Calculate duration
  const start = new Date(quotation.eventStartDate);
  const end = new Date(quotation.eventEndDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const discountAmount = ((quotation.subtotal + quotation.transportCharges + quotation.labourCharges) * quotation.discount) / 100;
  const taxableAmount = (quotation.subtotal + quotation.transportCharges + quotation.labourCharges) - discountAmount;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full print:p-0">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('quotation.title')} #{quotation.quotationId}</h2>
              <StatusBadge status={quotation.status} customText={t(`quotation.${statusKey}`)} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Generated on {new Date(quotation.createdAt || '').toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            {t('bookings.printAgreement', 'Print')}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/operations/quotations/${quotation._id}/edit`)}
            disabled={quotation.status === 'Converted'}
          >
            <Edit className="w-4 h-4" />
            {t('quotation.editQuotation', 'Edit')}
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center gap-2" 
            onClick={handleConvertToBooking}
            disabled={quotation.status === 'Converted'}
          >
            <CheckCircle className="w-4 h-4" />
            {t('bookings.newBooking', 'Convert to Booking')}
          </Button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div className="bg-card border border-border shadow-sm rounded-xl p-8 w-full print:border-0 print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-border pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-primary mb-1">Krishna Tent & Events</h1>
            <p className="text-sm text-muted-foreground">123 Industrial Area, Jaipur, Rajasthan</p>
            <p className="text-sm text-muted-foreground">GSTIN: 08AABCD1234E1Z5</p>
            <p className="text-sm text-muted-foreground">Phone: +91 98290 12345</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-foreground mb-2">QUOTATION</h2>
            <div className="text-sm">
              <span className="text-muted-foreground inline-block w-24">Quote No:</span>
              <span className="font-bold">{quotation.quotationId}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground inline-block w-24">Date:</span>
              <span className="font-bold">{new Date(quotation.createdAt || '').toLocaleDateString()}</span>
            </div>
            {quotation.validUntil && (
              <div className="text-sm">
                <span className="text-muted-foreground inline-block w-24">Valid Until:</span>
                <span className="font-bold">{new Date(quotation.validUntil).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">{t('quotation.quotationDetails')}</h3>
            <p className="font-bold text-lg text-foreground">{quotation.customer?.name || '—'}</p>
            <p className="text-sm text-muted-foreground">{quotation.customer?.address || '—'}</p>
            <p className="text-sm text-muted-foreground">Ph: {quotation.customer?.phone || '—'}</p>
            {quotation.customer?.gstNumber && (
              <p className="text-sm text-muted-foreground">GSTIN: {quotation.customer.gstNumber}</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">{t('quotation.eventDetails')}</h3>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Event Title:</span>
                <span className="font-bold text-foreground">{quotation.eventTitle}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-bold">{new Date(quotation.eventStartDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-bold">{new Date(quotation.eventEndDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-bold">{duration} Days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Event Type:</span>
                <span className="font-bold">{quotation.eventType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Address */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Venue Address</h3>
          <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border border-border/50">{quotation.venueAddress}</p>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-primary text-on-primary">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg font-bold">#</th>
                <th className="px-4 py-3 font-bold">Item Description</th>
                <th className="px-4 py-3 font-bold text-center">Rate/Day</th>
                <th className="px-4 py-3 font-bold text-center">Qty</th>
                <th className="px-4 py-3 font-bold text-center">Days</th>
                <th className="px-4 py-3 font-bold text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => {
                const itemObj = typeof item.item === 'object' ? item.item : null;
                const name = item.itemName || (itemObj as any)?.name || 'Unknown Item';
                const code = item.itemCode || (itemObj as any)?.code || '—';
                const rate = item.rentalRate !== undefined ? item.rentalRate : ((item as any).rentalPrice !== undefined ? (item as any).rentalPrice : ((itemObj as any)?.rentalPrice || 0));
                const qty = item.quantity || 0;
                const days = item.duration !== undefined ? item.duration : ((item as any).days || 1);
                const total = item.totalAmount !== undefined ? item.totalAmount : ((item as any).total || 0);

                return (
                  <tr key={index} className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{code}</p>
                    </td>
                    <td className="px-4 py-3 text-center">₹ {rate}</td>
                    <td className="px-4 py-3 text-center font-bold">{qty}</td>
                    <td className="px-4 py-3 text-center">{days}</td>
                    <td className="px-4 py-3 text-right font-bold">₹ {total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('quotation.itemsTotal')}:</span>
              <span className="font-bold">₹ {quotation.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('quotation.transport')}:</span>
              <span className="font-bold">₹ {quotation.transportCharges.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('quotation.labour')}:</span>
              <span className="font-bold">₹ {quotation.labourCharges.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="font-bold">{t('quotation.subTotal')}:</span>
              <span className="font-bold">₹ {(quotation.subtotal + quotation.transportCharges + quotation.labourCharges).toLocaleString()}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({quotation.discount}%):</span>
                <span className="font-bold">- ₹ {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('quotation.taxableAmount')}:</span>
              <span className="font-bold">₹ {taxableAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('quotation.gstChecked')} ({quotation.taxRate}%):</span>
              <span className="font-bold">₹ {quotation.taxAmount.toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-primary mt-2 pt-3 flex justify-between">
              <span className="text-lg font-black text-foreground">{t('quotation.grandTotal')}:</span>
              <span className="text-xl font-black text-primary">₹ {quotation.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-border pt-6 mt-8">
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Terms & Conditions
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>50% advance payment required to confirm booking and reserve items.</li>
            <li>Any damage to rental items will be charged to the customer at replacement cost.</li>
            <li>Transport and labour charges are estimates and may vary based on actual on-site conditions.</li>
            <li>Quotation is valid for 5 days from the date of issue.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
