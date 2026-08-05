'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ReceiptText, Truck, Wrench, RefreshCw, Search, Eye } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { expenseService, Expense } from '@/lib/services/expense.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export function ExpensesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // useSWR for caching data and quick loading
  const { data: expensesData, error, isLoading, mutate } = useSWR<Expense[]>(
    'expenses-list',
    () => expenseService.getExpenses()
  );

  const expenses = expensesData || [];

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await expenseService.deleteExpense(expenseToDelete);
        toast.success('Expense deleted successfully');
        mutate();
      } catch (err: any) {
        console.error('Error deleting expense:', err);
        toast.error('Failed to delete expense record');
      } finally {
        setDeleteModalOpen(false);
        setExpenseToDelete(null);
      }
    }
  };

  // Memoized counters
  const { totalExpenses, transportExpenses, maintenanceExpenses } = useMemo(() => {
    return expenses.reduce(
      (acc, curr) => {
        acc.totalExpenses += curr.amount;
        if (curr.category === 'Transport') acc.transportExpenses += curr.amount;
        if (curr.category === 'Maintenance') acc.maintenanceExpenses += curr.amount;
        return acc;
      },
      { totalExpenses: 0, transportExpenses: 0, maintenanceExpenses: 0 }
    );
  }, [expenses]);

  // Memoized filter query
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const term = searchQuery.toLowerCase();
      const matchesCategory = e.category.toLowerCase().includes(term);
      const matchesNotes = e.notes?.toLowerCase().includes(term) || false;
      const matchesMode = e.paymentMode.toLowerCase().includes(term);
      return matchesCategory || matchesNotes || matchesMode;
    });
  }, [expenses, searchQuery]);

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

  // Memoized table columns
  const columns = useMemo(() => [
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
            onClick={() => router.push(`/finance/expenses/${row._id}`)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Details"
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
              title="Delete Record"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    }
  ], [router]);

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('finance.expenses.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('finance.expenses.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => mutate()} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ActionGuard permission="finance.create">
            <Button 
              variant="primary" 
              onClick={() => router.push('/finance/expenses/new')} 
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('finance.expenses.addExpense')}
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* KPI stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <StatsCard title={t('finance.expenses.totalExpenses')} value={`₹ ${totalExpenses.toLocaleString()}`} icon={ReceiptText} colorTheme="error" />
        <StatsCard title="Transport Costs" value={`₹ ${transportExpenses.toLocaleString()}`} icon={Truck} colorTheme="blue" />
        <StatsCard title="Maintenance Costs" value={`₹ ${maintenanceExpenses.toLocaleString()}`} icon={Wrench} colorTheme="orange" />
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('finance.expenses.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading expenses...
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
          <DataTable
            columns={columns}
            data={filteredExpenses}
            className="p-0 border-0"
          />
        </div>
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
    </div>
  );
}
