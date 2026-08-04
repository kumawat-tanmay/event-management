'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Download, Edit, CheckCircle, FileText, Calendar, MapPin, Phone, Mail, Tag, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { quotationService, Quotation } from '@/lib/services/quotation.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { generatePdfFromHtml, sharePdfViaWhatsApp } from '@/utils/pdfShare';
import { getQuotationPdfHtml } from '@/utils/pdfTemplates';

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

  const handlePrintQuotation = (qtn: Quotation) => {
    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) return;

    const content = getQuotationPdfHtml(qtn);
    
    // Add print trigger script for standard printing
    const contentWithScript = content.replace('</body>', `
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
      </body>
    `);

    printWindow.document.write(contentWithScript);
    printWindow.document.close();
  };

  const handleSendWhatsApp = async (qtn: Quotation) => {
    const htmlContent = getQuotationPdfHtml(qtn);
    const filename = `Quotation_${qtn.quotationId}.pdf`;
    const customerPhone = qtn.customer?.phone || '';
    
    const message = `🏕️ *Krishna Tent & Events*

Dear ${qtn.customer?.name || 'Customer'},

Please find attached your *Quotation #${qtn.quotationId}* for the event:
📋 *${qtn.eventTitle}*
📅 ${new Date(qtn.eventStartDate).toLocaleDateString()} to ${new Date(qtn.eventEndDate).toLocaleDateString()}
📍 ${qtn.venueAddress}
💰 Grand Total: ₹${(qtn.grandTotal || 0).toLocaleString()}

This quotation is valid for 5 days. Please review and confirm.

Thank you!
📞 +91 98290 12345`;

    const blob = await generatePdfFromHtml(htmlContent, filename);
    if (blob) {
      await sharePdfViaWhatsApp(blob, filename, customerPhone, message);
    } else {
      alert("Failed to generate PDF");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (!quotation) return <div className="p-8 text-center text-error">Quotation not found</div>;

  let statusKey = 'draft';
  if (quotation.status === 'Sent') statusKey = 'sent';
  if (quotation.status === 'Approved') statusKey = 'approved';
  if (quotation.status === 'Converted') statusKey = 'converted';
  if (quotation.status === 'Rejected') statusKey = 'rejected';

  const start = new Date(quotation.eventStartDate);
  const end = new Date(quotation.eventEndDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const itemsTotal = quotation.subtotal || 0;
  const transport = quotation.transportCharges || 0;
  const labour = quotation.labourCharges || 0;
  const combinedSubtotal = (quotation.subtotal || 0) + transport + labour;
  const discountAmount = (combinedSubtotal * (quotation.discount || 0)) / 100;
  const taxableAmount = combinedSubtotal - discountAmount;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      {/* Header Bar */}
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('quotation.title')} #{quotation.quotationId}</h2>
              <StatusBadge status={quotation.status} customText={t(`quotation.${statusKey}`)} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Generated on {new Date(quotation.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <ActionGuard permission="quotations.update">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.push(`/operations/quotations/${quotation._id}/edit`)}
              disabled={quotation.status === 'Converted'}
            >
              <Edit className="w-4 h-4" />
              {t('quotation.editQuotation', 'Edit')}
            </Button>
          </ActionGuard>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => handleSendWhatsApp(quotation)}
          >
            <MessageSquare className="w-4 h-4" />
            Send to WhatsApp
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => handlePrintQuotation(quotation)}
          >
            <Printer className="w-4 h-4" />
            {t('bookings.printAgreement', 'Print Quotation')}
          </Button>

          <ActionGuard permission="bookings.create">
            <Button 
              variant="primary" 
              className="flex items-center gap-2" 
              onClick={handleConvertToBooking}
              disabled={quotation.status === 'Converted'}
            >
              <CheckCircle className="w-4 h-4" />
              {t('bookings.newBooking', 'Convert to Booking')}
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Main Grid matching BookingDetailView */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t('quotation.quotationDetails', 'Quotation & Event Details')}</CardTitle>
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
                      {new Date(quotation.eventStartDate).toLocaleDateString()} to {new Date(quotation.eventEndDate).toLocaleDateString()}
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
                      {quotation.venueAddress}
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
                    <p className="text-sm font-bold text-foreground mt-0.5">{quotation.customer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ph: {quotation.customer?.phone || '—'}</p>
                  </div>
                </div>

                {quotation.customer?.email && (
                  <div className="flex gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-muted-foreground uppercase">{t('crm.emailAddress')}</h4>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{quotation.customer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quoted Items & Services Table Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quoted Materials & Services</CardTitle>
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
                    {quotation.items.map((item: any, i: number) => {
                      const itemObj = typeof item.item === 'object' ? item.item : null;
                      const name = item.itemName || (itemObj as any)?.name || 'Unknown Item';
                      const code = item.itemCode || (itemObj as any)?.code || '—';
                      const rate = item.rentalRate !== undefined ? item.rentalRate : ((item as any).rentalPrice !== undefined ? (item as any).rentalPrice : ((itemObj as any)?.rentalPrice || 0));
                      const qty = item.quantity || 0;
                      const days = item.duration !== undefined ? item.duration : ((item as any).days || 1);
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

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Financial Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Financial Summary</CardTitle>
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
                <span className="font-semibold text-foreground">₹{transport.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tent Cost</span>
                <span className="font-semibold text-foreground">₹{labour.toLocaleString()}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-3 text-sm">
                <span className="font-bold text-foreground">Subtotal</span>
                <span className="font-bold text-foreground">₹{combinedSubtotal.toLocaleString()}</span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({quotation.discount}%)
                  </span>
                  <span className="font-bold">- ₹{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxable Amount</span>
                <span className="font-semibold text-foreground">₹{taxableAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({quotation.taxRate || 0}%)</span>
                <span className="font-semibold text-foreground">₹{(quotation.taxAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between border-t-2 border-primary pt-3.5 text-lg font-black text-foreground">
                <span>{t('quotation.grandTotal')}</span>
                <span className="text-primary">₹{(quotation.grandTotal || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                <li>50% advance payment required to confirm booking and reserve items.</li>
                <li>Any damage to rental items will be charged at replacement cost.</li>
                <li>Transport & labour charges are estimates based on site conditions.</li>
                <li>Quotation valid for 5 days from date of issue.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
