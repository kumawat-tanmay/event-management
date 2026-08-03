'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Download, Edit, CheckCircle, FileText, Calendar, MapPin, Phone, Mail, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { quotationService, Quotation } from '@/lib/services/quotation.services';
import { ActionGuard } from '@/components/auth/ActionGuard';

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

    const start = new Date(qtn.eventStartDate);
    const end = new Date(qtn.eventEndDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const itemsTotal = qtn.subtotal || 0;
    const transport = qtn.transportCharges || 0;
    const labour = qtn.labourCharges || 0;
    const combinedSubtotal = (qtn.subtotal || 0) + transport + labour;
    const discountAmt = (combinedSubtotal * (qtn.discount || 0)) / 100;
    const taxable = combinedSubtotal - discountAmt;

    const itemsRows = qtn.items.map((item, idx) => {
      const itemObj = typeof item.item === 'object' ? item.item : null;
      const name = item.itemName || (itemObj as any)?.name || 'Unknown Item';
      const code = item.itemCode || (itemObj as any)?.code || '—';
      const qty = item.quantity || 0;

      return `
        <tr>
          <td style="text-align: center; padding: 9px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${idx + 1}</td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
            <strong style="color: #0f172a; display: block;">${name}</strong>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">Code: ${code}</span>
          </td>
          <td style="text-align: center; padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #0f172a;">${qty} ${item.unit || 'pc'}</td>
        </tr>
      `;
    }).join('');

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quotation #${qtn.quotationId} - Krishna Tent & Events</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.5;
            }
            .a4-container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
            }
            .brand-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #0f172a;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            .company-info {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .doc-badge {
              text-align: right;
            }
            .doc-title {
              font-size: 22px;
              font-weight: 900;
              color: #ea580c;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .qtn-no {
              font-size: 14px;
              font-weight: 800;
              font-family: monospace;
              color: #0f172a;
              margin-top: 4px;
            }
            .info-grid {
              display: flex;
              gap: 16px;
              margin-bottom: 20px;
            }
            .info-card {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 14px;
            }
            .info-card-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 6px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
            }
            .info-card-text {
              font-size: 12px;
              color: #1e293b;
              margin: 3px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            .items-table th {
              background: #0f172a;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 9px 12px;
            }
            .financial-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 20px;
              margin-top: 15px;
            }
            .terms-box {
              flex: 1.2;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
            }
            .terms-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 6px;
            }
            .terms-list {
              margin: 0;
              padding-left: 16px;
              color: #475569;
              font-size: 10.5px;
            }
            .terms-list li { margin-bottom: 4px; }
            .ledger-box {
              width: 280px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              background: #ffffff;
            }
            .ledger-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 12px;
              font-size: 11.5px;
              color: #334155;
              border-bottom: 1px solid #f1f5f9;
            }
            .ledger-row.subtotal {
              font-weight: 700;
              color: #0f172a;
              background: #f8fafc;
            }
            .ledger-row.grand-total {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              background: #ffedd5;
              border-top: 2px solid #ea580c;
              padding: 10px 12px;
            }
            .signature-container {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 15px;
            }
            .sig-block {
              width: 200px;
              text-align: center;
              border-top: 1.5px dashed #64748b;
              padding-top: 6px;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="a4-container">
            <div class="brand-header">
              <div>
                <h1 class="company-name">KRISHNA TENT & EVENTS</h1>
                <div class="company-info">123 Industrial Area, Jaipur, Rajasthan | Phone: +91 98290 12345</div>
                <div class="company-info">GSTIN: 08AABCD1234E1Z5 | Email: info@krishnaevents.com</div>
              </div>
              <div class="doc-badge">
                <h2 class="doc-title">QUOTATION</h2>
                <div class="qtn-no"># ${qtn.quotationId}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  Date: <strong>${new Date(qtn.createdAt || Date.now()).toLocaleDateString()}</strong>
                </div>
                ${qtn.validUntil ? `<div style="font-size: 11px; color: #64748b;">Valid Until: <strong>${new Date(qtn.validUntil).toLocaleDateString()}</strong></div>` : ''}
              </div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <div class="info-card-title">CUSTOMER DETAILS</div>
                <div class="info-card-text"><strong>${qtn.customer?.name || '—'}</strong></div>
                <div class="info-card-text">Phone: ${qtn.customer?.phone || '—'}</div>
                ${qtn.customer?.email ? `<div class="info-card-text">Email: ${qtn.customer.email}</div>` : ''}
                ${qtn.customer?.address ? `<div class="info-card-text">Address: ${qtn.customer.address}</div>` : ''}
              </div>

              <div class="info-card">
                <div class="info-card-title">EVENT & VENUE SPECS</div>
                <div class="info-card-text">Title: <strong>${qtn.eventTitle}</strong></div>
                <div class="info-card-text">Event Type: ${qtn.eventType}</div>
                <div class="info-card-text">Duration: ${new Date(qtn.eventStartDate).toLocaleDateString()} to ${new Date(qtn.eventEndDate).toLocaleDateString()} (${durationDays} Days)</div>
                <div class="info-card-text">Venue: ${qtn.venueAddress}</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th style="text-align: left;">Item Description</th>
                  <th style="width: 100px; text-align: center;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="financial-section">
              <div class="terms-box">
                <div class="terms-title">TERMS & CONDITIONS</div>
                <ol class="terms-list">
                  <li>50% advance payment required to confirm booking and lock items.</li>
                  <li>Any loss or damage to rental inventory will be billed at replacement cost.</li>
                  <li>Transport and labour charges are estimates subject to site conditions.</li>
                  <li>This quotation is valid for 5 days from the date of issue.</li>
                </ol>
              </div>

              <div class="ledger-box">
                ${itemsTotal > 0 ? `
                  <div class="ledger-row">
                    <span>Materials Total:</span>
                    <span>₹ ${itemsTotal.toLocaleString()}</span>
                  </div>
                ` : ''}
                <div class="ledger-row">
                  <span>Transport / Car Cost:</span>
                  <span>₹ ${transport.toLocaleString()}</span>
                </div>
                <div class="ledger-row">
                  <span>Tent Cost:</span>
                  <span>₹ ${labour.toLocaleString()}</span>
                </div>
                <div class="ledger-row subtotal">
                  <span>Subtotal:</span>
                  <span>₹ ${combinedSubtotal.toLocaleString()}</span>
                </div>
                ${qtn.discount > 0 ? `
                  <div class="ledger-row" style="color: #16a34a;">
                    <span>Discount (${qtn.discount}%):</span>
                    <span>- ₹ ${discountAmt.toLocaleString()}</span>
                  </div>
                ` : ''}
                <div class="ledger-row">
                  <span>Taxable Amount:</span>
                  <span>₹ ${taxable.toLocaleString()}</span>
                </div>
                <div class="ledger-row">
                  <span>GST (${qtn.taxRate || 0}%):</span>
                  <span>₹ ${(qtn.taxAmount || 0).toLocaleString()}</span>
                </div>
                <div class="ledger-row grand-total">
                  <span>GRAND TOTAL:</span>
                  <span>₹ ${(qtn.grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="signature-container">
              <div class="sig-block">Customer Acceptance Signature</div>
              <div class="sig-block">Authorized Signatory (Krishna Events)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
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
