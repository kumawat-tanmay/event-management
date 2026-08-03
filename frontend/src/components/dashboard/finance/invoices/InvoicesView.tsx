'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Printer, RefreshCw, FileText, Search, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { invoiceService, Invoice } from '@/lib/services/invoice.services';
import { InvoiceBuilder } from './InvoiceBuilder';
import toast from 'react-hot-toast';

export function InvoicesView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      toast.error('Failed to load invoices history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await invoiceService.deleteInvoice(invoiceToDelete);
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } catch (error: any) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      } finally {
        setIsDeleteOpen(false);
        setInvoiceToDelete(null);
      }
    }
  };

  const handlePrint = (invoiceObj: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up blocked. Please allow pop-ups to print invoices.');

    const customer = invoiceObj.bookingId?.customer;
    const items = invoiceObj.bookingId?.items || [];

    const htmlContent = `
      <html>
        <head>
          <title>Tax Invoice - ${invoiceObj.invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5C3A21; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #5C3A21; }
            .title { font-size: 28px; font-weight: bold; color: #333; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
            .bill-to { font-weight: bold; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #5C3A21; color: white; text-align: left; padding: 10px; font-size: 14px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-table { width: 300px; }
            .totals-table td { padding: 8px; border: none; font-size: 14px; }
            .grand-total { font-weight: bold; font-size: 16px; border-top: 2px solid #5C3A21; color: #5C3A21; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">Krishna Tent & Events</div>
              <div>Godown Main Road, Jaipur, Rajasthan</div>
              <div>Phone: +91 9829012345</div>
            </div>
            <div>
              <div class="title">Tax Invoice</div>
              <div><strong>Invoice #:</strong> ${invoiceObj.invoiceNumber}</div>
              <div><strong>Date:</strong> ${new Date(invoiceObj.date).toLocaleDateString()}</div>
              <div><strong>Booking ID:</strong> ${invoiceObj.bookingId?.bookingId || ''}</div>
            </div>
          </div>

          <div class="details">
            <div>
              <div class="bill-to">BILL TO:</div>
              <div><strong>${customer?.name || 'Walk-in Customer'}</strong></div>
              <div>Phone: ${customer?.phone || '—'}</div>
              <div>Address: ${customer?.address || '—'}</div>
              ${customer?.gstNumber ? `<div>GSTIN: ${customer.gstNumber}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Rate (₹)</th>
                <th>Qty</th>
                <th>Days</th>
                <th>Discount</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>₹${item.rentalRate}</td>
                  <td>${item.quantity}</td>
                  <td>${item.duration}</td>
                  <td>${item.discount || 0}%</td>
                  <td>₹${item.totalAmount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${invoiceObj.subtotal.toLocaleString()}</td>
              </tr>
              ${invoiceObj.discount > 0 ? `
              <tr>
                <td>Discount:</td>
                <td style="text-align: right; color: red;">-₹${invoiceObj.discount.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td>CGST (${invoiceObj.gstRate / 2}%):</td>
                <td style="text-align: right;">₹${invoiceObj.cgstAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>SGST (${invoiceObj.gstRate / 2}%):</td>
                <td style="text-align: right;">₹${invoiceObj.sgstAmount.toLocaleString()}</td>
              </tr>
              <tr class="grand-total">
                <td>Total Amount:</td>
                <td style="text-align: right;">₹${invoiceObj.totalAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            Thank you for doing business with Krishna Tent & Events!<br>
            This is a computer generated invoice and does not require physical signatures.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchQuery.toLowerCase();
    const matchesNumber = inv.invoiceNumber.toLowerCase().includes(term);
    const matchesBooking = inv.bookingId?.bookingId?.toLowerCase().includes(term) || false;
    const matchesCustomer = inv.bookingId?.customer?.name?.toLowerCase().includes(term) || false;
    return matchesNumber || matchesBooking || matchesCustomer;
  });

  const columns = [
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
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedInvoice(row);
              setIsDetailOpen(true);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePrint(row)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setInvoiceToDelete(row._id);
              setIsDeleteOpen(true);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Tax Invoices</h2>
          <p className="text-sm font-medium text-muted-foreground">Generate B2B tax invoices, track GST breakdowns, and print invoices.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchInvoices} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setIsBuilderOpen(true)} className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices by invoice number, booking code or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading invoices...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
        />
      )}

      {/* Invoice Builder Modal */}
      {isBuilderOpen && (
        <Modal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          title="Generate Tax Invoice"
          size="lg"
        >
          <InvoiceBuilder
            onClose={() => setIsBuilderOpen(false)}
            onSuccess={() => {
              setIsBuilderOpen(false);
              fetchInvoices();
            }}
          />
        </Modal>
      )}

      {/* Detail View Modal */}
      {isDetailOpen && selectedInvoice && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-6 pt-4 font-sans text-foreground">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-6 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Bill To</p>
                <p className="text-sm font-black">{selectedInvoice.bookingId?.customer?.name || 'Walk-in'}</p>
                <p className="text-xs text-muted-foreground">{selectedInvoice.bookingId?.customer?.phone || '—'}</p>
                {selectedInvoice.bookingId?.customer?.gstNumber && (
                  <p className="text-xs font-semibold text-primary mt-1">GSTIN: {selectedInvoice.bookingId.customer.gstNumber}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold">Booking Details</p>
                <p className="text-sm font-black">{selectedInvoice.bookingId?.bookingId}</p>
                <p className="text-xs text-muted-foreground">{selectedInvoice.bookingId?.eventTitle}</p>
                <p className="text-xs text-muted-foreground">{new Date(selectedInvoice.bookingId?.eventStartDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">₹ {selectedInvoice.subtotal.toLocaleString()}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-sm text-error">
                  <span>Discount</span>
                  <span className="font-semibold">-₹ {selectedInvoice.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-border/40 pt-2">
                <span>CGST ({selectedInvoice.gstRate / 2}%)</span>
                <span>₹ {selectedInvoice.cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST ({selectedInvoice.gstRate / 2}%)</span>
                <span>₹ {selectedInvoice.sgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black border-t border-border pt-2 text-primary">
                <span>Grand Total</span>
                <span>₹ {selectedInvoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
              <Button variant="primary" onClick={() => handlePrint(selectedInvoice)} className="gap-2">
                <Printer className="w-4 h-4" />
                Print Invoice
              </Button>
            </div>
          </div>
        </Modal>
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
