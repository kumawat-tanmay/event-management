'use client';

import React, { useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  Wallet, 
  User, 
  Calendar, 
  CreditCard, 
  ReceiptText, 
  Printer, 
  Trash2, 
  ArrowUpRight, 
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { paymentService } from '@/lib/services/payment.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function PaymentDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch payment detail
  const { data: payment, isLoading, error, mutate } = useSWR(
    id ? `payment-detail-${id}` : null,
    () => paymentService.getPaymentById(id)
  );

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will adjust the booking balance.')) return;
    try {
      await paymentService.deletePayment(id);
      toast.success('Payment deleted successfully');
      router.push('/finance/payments');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete payment');
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

  if (error || !payment) {
    return (
      <div className="p-6 text-center text-error">
        {t('common.failedLoad', 'Failed to load transaction details.')}
      </div>
    );
  }

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
              {t('finance.payments.details.title')}
              <span className="text-sm font-mono text-muted-foreground font-normal">#{payment.transactionId || payment._id.slice(-6)}</span>
            </h1>
            <p className="text-xs text-muted-foreground">{t('finance.payments.details.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{t('finance.payments.details.printReceipt')}</span>
          </Button>

          <ActionGuard permission="finance.delete">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-error/30 text-error hover:bg-error/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Delete</span>
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Main Printable Area */}
      <div ref={printAreaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:flex print:flex-col">
        {/* Left Column (Voucher Receipt Sheet) */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          {/* Detailed Statement Voucher */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6 relative print:border-none print:shadow-none">
            {/* Watermark/Logo stamp background for premium look */}
            <div className="absolute right-6 top-6 opacity-[0.03] select-none pointer-events-none hidden sm:block">
              <Wallet className="w-48 h-48 text-primary" />
            </div>

            {/* Receipt Header details (shows in print) */}
            <div className="hidden print:flex items-center justify-between border-b border-border pb-6 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">KRISHNA TENT & EVENTS</h2>
                <p className="text-xs text-muted-foreground">Payment Receipt Statement</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono">#{payment.transactionId}</p>
                <p className="text-xs text-muted-foreground">{new Date(payment.transactionDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-6 border-b border-border/50 pb-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              <h2>Payment Statement</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Amount</span>
                <div className="text-3xl font-black text-foreground">
                  ₹ {payment.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Status</span>
                <div className="h-10 flex items-center">
                  <StatusBadge 
                    status={payment.paymentType === 'refund' ? 'Damaged' : 'Available'} 
                    customText={payment.paymentType === 'refund' ? 'REFUNDED' : 'SETTLED'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Mode</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  {payment.paymentMode}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Date</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(payment.transactionDate).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher / Payment Type</span>
                <div className="text-sm font-bold text-foreground capitalize">
                  {payment.paymentType.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Reference ID</span>
                <div className="text-sm font-mono font-bold text-foreground">
                  {payment.transactionId || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recorded By</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  {payment.createdBy?.name || 'System Auto'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Created Timestamp</span>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(payment.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-8 pt-6 border-t border-border/50 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remarks / Notes</span>
                <p className="text-sm text-foreground bg-muted/20 border border-border/40 p-4 rounded-xl italic">
                  "{payment.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Party and Booking Details) */}
        <div className="space-y-6 print:w-full print:mt-6">
          {/* Party / Customer details */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base border-b border-border/50 pb-2">
              <User className="w-4 h-4 text-primary" />
              <h2>Customer Profile</h2>
            </div>
            {payment.customerId ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name</span>
                  <p className="text-sm font-bold text-foreground">{payment.customerId.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                  <p className="text-sm font-bold text-foreground">{payment.customerId.phone}</p>
                </div>
                {payment.customerId.email && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</span>
                    <p className="text-sm font-medium text-foreground">{payment.customerId.email}</p>
                  </div>
                )}
                {payment.customerId.address && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</span>
                    <p className="text-xs text-muted-foreground">{payment.customerId.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No Customer details attached.</p>
            )}
          </div>

          {/* Booking Info ledger */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <FileText className="w-4 h-4 text-primary" />
                <h2>Booking Ledger</h2>
              </div>
              {payment.bookingId?._id && (
                <button
                  onClick={() => router.push(`/operations/bookings/${payment.bookingId?._id}`)}
                  className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline cursor-pointer print:hidden"
                >
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {payment.bookingId ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booking ID</span>
                    <p className="text-sm font-mono font-bold text-foreground">{payment.bookingId.bookingId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Title</span>
                    <p className="text-sm font-semibold text-foreground truncate">{payment.bookingId.eventTitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total</span>
                    <span className="text-xs font-bold text-foreground">₹{payment.bookingId.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Paid</span>
                    <span className="text-xs font-bold text-success">₹{payment.bookingId.advancePaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Remaining</span>
                    <span className="text-xs font-bold text-error">₹{payment.bookingId.balanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Direct ledger transaction — not tied to event booking.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
