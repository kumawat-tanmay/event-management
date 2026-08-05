'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Printer, RefreshCw, FileText, Search, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { invoiceService, Invoice } from '@/lib/services/invoice.services';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export function InvoicesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // useSWR for caching invoices
  const { data: invoicesData, error, isLoading, mutate } = useSWR<Invoice[]>(
    'invoices-list',
    () => invoiceService.getInvoices()
  );

  const invoices = invoicesData || [];

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await invoiceService.deleteInvoice(invoiceToDelete);
        toast.success('Invoice cancelled and deleted successfully');
        mutate();
      } catch (error: any) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      } finally {
        setIsDeleteOpen(false);
        setInvoiceToDelete(null);
      }
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const term = searchQuery.toLowerCase();
      const matchesNumber = inv.invoiceNumber.toLowerCase().includes(term);
      const matchesBooking = inv.bookingId?.bookingId?.toLowerCase().includes(term) || false;
      const matchesCustomer = inv.bookingId?.customer?.name?.toLowerCase().includes(term) || false;
      return matchesNumber || matchesBooking || matchesCustomer;
    });
  }, [invoices, searchQuery]);

  const columns = useMemo(() => [
    {
      header: 'Invoice Number',
      accessorKey: 'invoiceNumber',
      cell: (row: Invoice) => (
        <span className="font-black text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row: Invoice) => new Date(row.date).toLocaleDateString()
    },
    {
      header: 'Booking ID',
      accessorKey: 'bookingId',
      cell: (row: Invoice) => row.bookingId?.bookingId || '—'
    },
    {
      header: 'Customer',
      accessorKey: 'bookingId.customer.name',
      cell: (row: Invoice) => row.bookingId?.customer?.name || '—'
    },
    {
      header: 'Total Amount',
      accessorKey: 'totalAmount',
      cell: (row: Invoice) => (
        <span className="font-bold text-foreground">
          ₹{row.totalAmount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Invoice) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          row.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: Invoice) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/finance/invoices/${row._id}`)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setInvoiceToDelete(row._id);
              setIsDeleteOpen(true);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
            title="Cancel/Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ], [router]);

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('finance.invoices.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('finance.invoices.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => mutate()} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            onClick={() => router.push('/finance/invoices/new')} 
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('finance.invoices.createInvoice')}
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('finance.invoices.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading invoices...
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredInvoices}
            className="p-0 border-0"
          />
        </div>
      )}

      {/* Confirm Cancel/Delete Invoice Modal */}
      {isDeleteOpen && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Tax Invoice"
          message="Are you sure you want to delete this invoice? This action will remove the transaction record and cancel the tax liability entry."
        />
      )}
    </div>
  );
}
