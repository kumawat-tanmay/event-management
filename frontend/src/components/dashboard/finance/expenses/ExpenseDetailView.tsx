'use client';

import React, { useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  ReceiptText, 
  Calendar, 
  CreditCard, 
  Printer, 
  Trash2, 
  ArrowUpRight, 
  FileText,
  Clock,
  User,
  Truck,
  Wrench,
  Tag
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { expenseService } from '@/lib/services/expense.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ExpenseDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch expense detail
  const { data: expense, isLoading, error } = useSWR(
    id ? `expense-detail-${id}` : null,
    () => expenseService.getExpenseById(id)
  );

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense record? This action cannot be undone.')) return;
    try {
      await expenseService.deleteExpense(id);
      toast.success('Expense deleted successfully');
      router.push('/finance/expenses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete expense');
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

  if (error || !expense) {
    return (
      <div className="p-6 text-center text-error">
        {t('common.failedLoad', 'Failed to load expense details.')}
      </div>
    );
  }

  const getReferenceTitle = () => {
    if (expense.refModel === 'Booking') return 'Associated Booking';
    if (expense.refModel === 'Staff') return 'Associated Staff Member';
    if (expense.refModel === 'Vehicle') return 'Associated Vehicle Fleet';
    return 'Reference Info';
  };

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
              {t('finance.expenses.details.title')}
              <span className="text-sm font-mono text-muted-foreground font-normal">#{expense._id.slice(-6).toUpperCase()}</span>
            </h1>
            <p className="text-xs text-muted-foreground">{t('finance.expenses.details.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{t('finance.expenses.details.printReceipt')}</span>
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

      {/* Main Grid Section */}
      <div ref={printAreaRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:flex print:flex-col">
        {/* Left Column (Statement Voucher) */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6 relative print:border-none print:shadow-none">
            {/* Watermark/stamp */}
            <div className="absolute right-6 top-6 opacity-[0.03] select-none pointer-events-none hidden sm:block">
              <ReceiptText className="w-48 h-48 text-primary" />
            </div>

            {/* Print Header */}
            <div className="hidden print:flex items-center justify-between border-b border-border pb-6 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">KRISHNA TENT & EVENTS</h2>
                <p className="text-xs text-muted-foreground">Expense Debit Voucher</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono">#{expense._id.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-6 border-b border-border/50 pb-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              <h2>Debit Statement</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Debit Amount</span>
                <div className="text-3xl font-black text-error">
                  ₹ {expense.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher Status</span>
                <div className="h-10 flex items-center">
                  <StatusBadge 
                    status="Unpaid" 
                    customText="DEBITED"
                    className="bg-error/10 text-error border-error/25"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expense Category</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {expense.category}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Mode</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  {expense.paymentMode}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expense Date</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recorded By</span>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {expense.createdBy?.name || 'System Auto'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Created Timestamp</span>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(expense.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {expense.notes && (
              <div className="mt-8 pt-6 border-t border-border/50 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remarks / Notes</span>
                <p className="text-sm text-foreground bg-muted/20 border border-border/40 p-4 rounded-xl italic">
                  "{expense.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Contextual details) */}
        <div className="space-y-6 print:w-full print:mt-6">
          {expense.refModel && expense.referenceId ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2 text-foreground font-bold text-base">
                  {expense.refModel === 'Booking' && <FileText className="w-4 h-4 text-primary" />}
                  {expense.refModel === 'Staff' && <User className="w-4 h-4 text-primary" />}
                  {expense.refModel === 'Vehicle' && <Truck className="w-4 h-4 text-primary" />}
                  <h2>{getReferenceTitle()}</h2>
                </div>
                
                {expense.refModel === 'Booking' && expense.referenceId._id && (
                  <button
                    onClick={() => router.push(`/operations/bookings/${expense.referenceId._id}`)}
                    className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline cursor-pointer print:hidden"
                  >
                    View <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {expense.refModel === 'Booking' && (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booking ID</span>
                      <p className="text-sm font-mono font-bold text-foreground">{expense.referenceId.bookingId}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Title</span>
                      <p className="text-sm font-semibold text-foreground">{expense.referenceId.eventTitle}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining Balance</span>
                      <p className="text-sm font-bold text-error">₹{expense.referenceId.balanceAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </>
                )}

                {expense.refModel === 'Staff' && (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Staff Name</span>
                      <p className="text-sm font-bold text-foreground">{expense.referenceId.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</span>
                      <p className="text-sm font-semibold text-foreground capitalize">{expense.referenceId.role}</p>
                    </div>
                    {expense.referenceId.phone && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                        <p className="text-sm text-foreground">{expense.referenceId.phone}</p>
                      </div>
                    )}
                  </>
                )}

                {expense.refModel === 'Vehicle' && (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Name</span>
                      <p className="text-sm font-bold text-foreground">{expense.referenceId.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plate Number</span>
                      <p className="text-sm font-mono font-bold text-foreground">{expense.referenceId.plateNumber}</p>
                    </div>
                    {expense.referenceId.type && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</span>
                        <p className="text-sm text-foreground capitalize">{expense.referenceId.type}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-base border-b border-border/50 pb-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h2>Context Info</h2>
              </div>
              <p className="text-xs text-muted-foreground italic">General operational expense – not linked to bookings, staff, or fleet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
