'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Wallet, CreditCard, RefreshCw, Eye, Search, AlertCircle, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { paymentService, Payment } from '@/lib/services/payment.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { PaymentForm } from './PaymentForm';
import toast from 'react-hot-toast';

export function PaymentsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getPayments();
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      toast.error('Failed to load payments history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const confirmDelete = async () => {
    if (paymentToDelete) {
      try {
        await paymentService.deletePayment(paymentToDelete);
        toast.success('Payment deleted successfully and booking balance adjusted.');
        fetchPayments();
      } catch (error: any) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment transaction');
      } finally {
        setIsDeleteOpen(false);
        setPaymentToDelete(null);
      }
    }
  };

  const totalPayments = payments.reduce((acc, curr) => {
    if (curr.paymentType === 'refund') return acc - curr.amount;
    return acc + curr.amount;
  }, 0);

  const cashPayments = payments.reduce((acc, curr) => {
    if (curr.paymentMode === 'Cash') {
      return acc + (curr.paymentType === 'refund' ? -curr.amount : curr.amount);
    }
    return acc;
  }, 0);

  const bankPayments = payments.reduce((acc, curr) => {
    if (curr.paymentMode !== 'Cash') {
      return acc + (curr.paymentType === 'refund' ? -curr.amount : curr.amount);
    }
    return acc;
  }, 0);

  const filteredPayments = payments.filter(p => {
    const term = searchQuery.toLowerCase();
    const matchesBooking = p.bookingId?.bookingId?.toLowerCase().includes(term) || false;
    const matchesCustomer = p.customerId?.name?.toLowerCase().includes(term) || false;
    const matchesNotes = p.notes?.toLowerCase().includes(term) || false;
    return matchesBooking || matchesCustomer || matchesNotes;
  });

  const columns = [
    {
      header: 'Date',
      accessorKey: 'transactionDate',
      cell: (row: Payment) => new Date(row.transactionDate).toLocaleDateString()
    },
    {
      header: 'Booking ID',
      accessorKey: 'bookingId',
      cell: (row: Payment) => row.bookingId?.bookingId || 'General'
    },
    {
      header: 'Customer',
      accessorKey: 'customerId',
      cell: (row: Payment) => row.customerId?.name || '—'
    },
    {
      header: 'Type',
      accessorKey: 'paymentType',
      cell: (row: Payment) => (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          row.paymentType === 'advance' ? 'bg-primary/10 text-primary' :
          row.paymentType === 'final' ? 'bg-success/10 text-success' :
          row.paymentType === 'refund' ? 'bg-error/10 text-error' :
          'bg-muted text-muted-foreground'
        }`}>
          {row.paymentType.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Mode',
      accessorKey: 'paymentMode',
      cell: (row: Payment) => (
        <span className="font-semibold text-foreground text-sm">
          {row.paymentMode}
        </span>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row: Payment) => (
        <span className={`font-bold ${row.paymentType === 'refund' ? 'text-error' : 'text-foreground'}`}>
          {row.paymentType === 'refund' ? '-' : ''}₹{row.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: Payment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPayment(row);
              setIsDetailOpen(true);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <ActionGuard permission="finance.delete">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setPaymentToDelete(row._id);
                setIsDeleteOpen(true);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Payments Ledger</h2>
          <p className="text-sm font-medium text-muted-foreground">Track booking advances, settlements, refunds, and cash inflows.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchPayments} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ActionGuard permission="finance.create">
            <Button variant="primary" onClick={() => setIsFormOpen(true)} className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* KPI stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Payments" value={`₹ ${totalPayments.toLocaleString()}`} icon={Wallet} colorTheme="success" />
        <StatsCard title="Cash Balance" value={`₹ ${cashPayments.toLocaleString()}`} icon={CreditCard} colorTheme="warning" />
        <StatsCard title="Bank / UPI Balance" value={`₹ ${bankPayments.toLocaleString()}`} icon={CreditCard} colorTheme="blue" />
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payments by booking code, customer name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading payments...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
        />
      )}

      {/* Record Payment Form Modal */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Record New Payment"
          size="lg"
        >
          <PaymentForm
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchPayments();
            }}
          />
        </Modal>
      )}

      {/* Detail View Modal */}
      {isDetailOpen && selectedPayment && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Payment Transaction Details"
          size="md"
        >
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Transaction Date</p>
                <p className="text-sm font-bold">{new Date(selectedPayment.transactionDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-bold text-success">₹ {selectedPayment.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Payment Type</p>
                <p className="text-sm font-bold capitalize">{selectedPayment.paymentType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Mode</p>
                <p className="text-sm font-bold">{selectedPayment.paymentMode}</p>
              </div>
            </div>
            {selectedPayment.transactionId && (
              <div className="border-b border-border pb-4">
                <p className="text-xs text-muted-foreground">Transaction ID / Reference</p>
                <p className="text-sm font-bold">{selectedPayment.transactionId}</p>
              </div>
            )}
            <div className="border-b border-border pb-4">
              <p className="text-xs text-muted-foreground">Associated Booking</p>
              <p className="text-sm font-bold">{selectedPayment.bookingId?.bookingId ? `${selectedPayment.bookingId.bookingId} - ${selectedPayment.bookingId.eventTitle}` : 'General / Direct'}</p>
            </div>
            <div className="border-b border-border pb-4">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-bold">{selectedPayment.customerId?.name || '—'}</p>
            </div>
            {selectedPayment.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Remarks / Notes</p>
                <p className="text-sm text-foreground">{selectedPayment.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Confirm Delete Transaction Modal */}
      {isDeleteOpen && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Payment Transaction"
          message="Are you sure you want to delete this payment record? This action will restore the unpaid balance on the booking."
        />
      )}
    </div>
  );
}
