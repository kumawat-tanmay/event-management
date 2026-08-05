'use client';

import React, { useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Printer, 
  Trash2, 
  ArrowUpRight, 
  Clock,
  User,
  MapPin,
  Phone,
  Tag,
  Percent,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { invoiceService } from '@/lib/services/invoice.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function InvoiceDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch invoice details
  const { data: invoice, isLoading, error } = useSWR(
    id ? `invoice-detail-${id}` : null,
    () => invoiceService.getInvoiceById(id)
  );

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete / cancel this tax invoice? This action cannot be undone.')) return;
    try {
      await invoiceService.deleteInvoice(id);
      toast.success('Invoice cancelled and deleted successfully');
      router.push('/finance/invoices');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 text-center text-error">
        Failed to load tax invoice details.
      </div>
    );
  }

  const booking = invoice.bookingId;
  const customer = booking?.customer;
  const items = booking?.items || [];
  const baseAmount = (booking?.subtotal || 0) + (booking?.transportCharges || 0) + (booking?.labourCharges || 0);

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 max-w-full print:p-0">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
              {t('finance.invoices.details.title')}
              <span className="text-sm font-mono text-muted-foreground font-normal">#{invoice.invoiceNumber}</span>
            </h1>
            <p className="text-xs text-muted-foreground">{t('finance.invoices.details.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{t('finance.invoices.details.printInvoice')}</span>
          </Button>

          <ActionGuard permission="finance.delete">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-error/30 text-error hover:bg-error/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Cancel Invoice</span>
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Main Printable Grid */}
      <div ref={printAreaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:flex print:flex-col">
        {/* Left Column (Tax Invoice Sheet) */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6 relative print:border-none print:shadow-none">
            {/* Watermark Logo */}
            <div className="absolute right-6 top-6 opacity-[0.03] select-none pointer-events-none hidden sm:block">
              <FileText className="w-48 h-48 text-primary" />
            </div>

            {/* Print Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-6 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">KRISHNA TENT & EVENTS</h2>
                <p className="text-xs text-muted-foreground">Godown Main Road, Jaipur, Rajasthan</p>
                <p className="text-xs text-muted-foreground">Phone: +91 98290 12345</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-primary">TAX INVOICE</h3>
                <p className="text-sm font-mono font-bold text-foreground">#{invoice.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">Date: {new Date(invoice.date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To & Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">BILL TO:</span>
                <p className="font-bold text-foreground flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {customer?.name || 'Walk-in Customer'}
                </p>
                {customer?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </p>
                )}
                {customer?.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {customer.address}
                  </p>
                )}
                {customer?.gstNumber && (
                  <p className="text-xs font-bold text-primary mt-1">GSTIN: {customer.gstNumber}</p>
                )}
              </div>

              <div className="space-y-1.5 md:text-right md:items-end flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">EVENT DETAILS:</span>
                {booking ? (
                  <>
                    <p className="font-bold text-foreground">
                      {booking.eventTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booking: {booking.bookingId}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 md:justify-end">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(booking.eventStartDate).toLocaleDateString()} to {new Date(booking.eventEndDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Direct invoice ledger entry.</p>
                )}
              </div>
            </div>

            {/* Table of Items */}
            <div className="border border-border rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-bold text-muted-foreground">
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center w-24">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length > 0 ? (
                    items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="p-3 font-semibold text-foreground">
                          {item.itemName}
                        </td>
                        <td className="p-3 text-center font-bold text-foreground">{item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-muted-foreground italic">No items detailed in booking order.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations and Breakdown */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 border-t border-border/50 pt-6">
              <div className="text-xs text-muted-foreground max-w-sm">
                <p className="font-bold mb-1">Invoice Status</p>
                <div className="flex items-center gap-1.5 mb-3">
                  {invoice.status === 'Paid' ? (
                    <span className="flex items-center gap-1 text-success font-bold text-sm bg-success/5 border border-success/20 px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-4 h-4" /> PAID
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning font-bold text-sm bg-warning/5 border border-warning/20 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-4 h-4" /> UNPAID
                    </span>
                  )}
                </div>
                <p>This is a computer generated document complying with the central goods & services tax (CGST/SGST) guidelines. Requires no physical signature.</p>
              </div>

              <div className="w-full sm:w-80 space-y-2 text-sm border border-border/60 bg-muted/20 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-semibold">₹ {baseAmount.toLocaleString('en-IN')}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-error font-medium">
                    <span>Cash Discount</span>
                    <span>-₹ {invoice.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
                  <span>CGST ({invoice.gstRate / 2}%)</span>
                  <span>₹ {invoice.cgstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>SGST ({invoice.gstRate / 2}%)</span>
                  <span>₹ {invoice.sgstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between border-t border-border pt-2 text-base font-black text-primary">
                  <span>Invoice Total</span>
                  <span>₹ {invoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Audit and booking ledger refs) */}
        <div className="space-y-6 print:w-full print:mt-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-foreground font-bold text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Voucher Registry
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-wider block">Created By</span>
                <p className="text-sm font-semibold text-foreground">{invoice.createdBy?.name || 'System Auto'}</p>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-wider block">Created Timestamp</span>
                <p className="text-sm font-semibold text-foreground">{new Date(invoice.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-wider block">Last Updated</span>
                <p className="text-sm font-semibold text-foreground">{new Date(invoice.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {booking && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h2 className="text-foreground font-bold text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Booking Ledger
                </h2>
                <button
                  onClick={() => router.push(`/operations/bookings/${booking._id}`)}
                  className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline cursor-pointer print:hidden"
                >
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-wider block">Grand Total</span>
                    <p className="text-sm font-bold text-foreground">₹{booking.grandTotal.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-wider block">Dues Balance</span>
                    <p className={`text-sm font-bold ${booking.balanceAmount > 0 ? 'text-amber-600' : 'text-success'}`}>
                      ₹{booking.balanceAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
