'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ReceiptText, Truck, Wrench, RefreshCw, Search, Eye } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { expenseService, Expense } from '@/lib/services/expense.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { ExpenseForm } from './ExpenseForm';
import toast from 'react-hot-toast';

export function ExpensesView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data || []);
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      toast.error('Failed to load expenses history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await expenseService.deleteExpense(expenseToDelete);
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } catch (err: any) {
        console.error('Error deleting expense:', err);
        toast.error('Failed to delete expense record');
      } finally {
        setDeleteModalOpen(false);
        setExpenseToDelete(null);
      }
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const transportExpenses = expenses.reduce((acc, curr) => 
    curr.category === 'Transport' ? acc + curr.amount : acc, 0
  );

  const maintenanceExpenses = expenses.reduce((acc, curr) => 
    curr.category === 'Maintenance' ? acc + curr.amount : acc, 0
  );

  const filteredExpenses = expenses.filter(e => {
    const term = searchQuery.toLowerCase();
    const matchesCategory = e.category.toLowerCase().includes(term);
    const matchesNotes = e.notes?.toLowerCase().includes(term) || false;
    const matchesMode = e.paymentMode.toLowerCase().includes(term);
    return matchesCategory || matchesNotes || matchesMode;
  });

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row: Expense) => new Date(row.date).toLocaleDateString()
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row: Expense) => (
        <span className="font-bold text-foreground">
          {row.category}
        </span>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row: Expense) => (
        <span className="font-bold text-error">
          ₹{row.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      accessorKey: 'paymentMode',
      cell: (row: Expense) => row.paymentMode
    },
    {
      header: 'Reference',
      accessorKey: 'refModel',
      cell: (row: Expense) => row.refModel ? `${row.refModel}` : 'Operational'
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (row: Expense) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.notes || '—'}</span>
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: Expense) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedExpense(row);
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
                setExpenseToDelete(row._id);
                setDeleteModalOpen(true);
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

  const getReferenceDisplay = (expense: Expense) => {
    if (!expense.referenceId) return '—';
    if (typeof expense.referenceId === 'string') return expense.referenceId;
    
    const ref = expense.referenceId;
    if (expense.refModel === 'Booking') {
      const bId = ref.bookingId && typeof ref.bookingId === 'object' ? ref.bookingId.bookingId : ref.bookingId;
      return `${bId || ref._id || 'Booking'} ${ref.eventTitle ? `(${ref.eventTitle})` : ''}`;
    }
    
    return ref.name || ref.plateNumber || ref._id || '—';
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Expenses Ledger</h2>
          <p className="text-sm font-medium text-muted-foreground">Track staff wages, transportation costs, warehouse maintenance, and purchases.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchExpenses} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ActionGuard permission="finance.create">
            <Button variant="primary" onClick={() => setIsFormOpen(true)} className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Log Expense
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* KPI stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Expenses" value={`₹ ${totalExpenses.toLocaleString()}`} icon={ReceiptText} colorTheme="error" />
        <StatsCard title="Transport Costs" value={`₹ ${transportExpenses.toLocaleString()}`} icon={Truck} colorTheme="blue" />
        <StatsCard title="Maintenance Costs" value={`₹ ${maintenanceExpenses.toLocaleString()}`} icon={Wrench} colorTheme="orange" />
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search expenses by category, payment mode, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading expenses...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredExpenses}
        />
      )}

      {/* Log Expense Form Modal */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Log Operational Expense"
          size="lg"
        >
          <ExpenseForm
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchExpenses();
            }}
          />
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {deleteModalOpen && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Expense Record"
          message="Are you sure you want to delete this expense record? This action cannot be undone."
        />
      )}

      {/* Detail View Modal */}
      {isDetailOpen && selectedExpense && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Expense Details"
          size="md"
        >
          <div className="space-y-4 pt-4 font-sans text-foreground">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Expense Date</p>
                <p className="text-sm font-bold">{new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Amount Paid</p>
                <p className="text-sm font-bold text-error">₹ {selectedExpense.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Category</p>
                <p className="text-sm font-bold">{selectedExpense.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Payment Mode</p>
                <p className="text-sm font-bold">{selectedExpense.paymentMode}</p>
              </div>
            </div>
            {selectedExpense.refModel && (
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Associated Module</p>
                  <p className="text-sm font-bold">{selectedExpense.refModel}</p>
                </div>
                {selectedExpense.referenceId && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Reference Info</p>
                    <p className="text-sm font-bold font-mono text-xs">{getReferenceDisplay(selectedExpense)}</p>
                  </div>
                )}
              </div>
            )}
            {selectedExpense.notes && (
              <div className="border-b border-border pb-4">
                <p className="text-xs text-muted-foreground uppercase font-bold">Remarks / Notes</p>
                <p className="text-sm text-foreground">{selectedExpense.notes}</p>
              </div>
            )}
            {selectedExpense.createdBy?.name && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Recorded By</p>
                <p className="text-sm font-semibold">{selectedExpense.createdBy.name}</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
