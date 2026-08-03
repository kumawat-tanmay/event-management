'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Wallet, CreditCard, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { financeService, LedgerItem, BankbookSummary } from '@/lib/services/finance.services';
import toast from 'react-hot-toast';

export function BankbookView() {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<BankbookSummary>({
    totalBankIn: 0,
    totalBankOut: 0,
    currentBalance: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBankbook = async () => {
    setLoading(true);
    try {
      const data = await financeService.getBankbook();
      setLedger(data.ledger || []);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error loading bankbook:', err);
      toast.error('Failed to load bankbook records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankbook();
  }, []);

  const filteredLedger = ledger.filter(item => {
    const term = searchQuery.toLowerCase();
    return item.source.toLowerCase().includes(term) ||
           item.reference.toLowerCase().includes(term) ||
           (item.transactionId || '').toLowerCase().includes(term) ||
           (item.notes || '').toLowerCase().includes(term);
  });

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row: LedgerItem) => new Date(row.date).toLocaleDateString()
    },
    {
      header: 'Source / Category',
      accessorKey: 'source',
      cell: (row: LedgerItem) => (
        <span className="font-bold text-foreground">
          {row.source}
        </span>
      )
    },
    {
      header: 'Event / Reference',
      accessorKey: 'reference',
      cell: (row: LedgerItem) => (
        <span className="text-sm font-semibold">
          {row.reference}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      accessorKey: 'mode',
      cell: (row: LedgerItem) => (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {row.mode}
        </span>
      )
    },
    {
      header: 'Transaction ID',
      accessorKey: 'transactionId',
      cell: (row: LedgerItem) => <span className="text-xs font-mono">{row.transactionId || '—'}</span>
    },
    {
      header: 'Debit (Bank In)',
      accessorKey: 'amount',
      cell: (row: LedgerItem) => row.type === 'receipt' ? (
        <span className="font-bold text-success">
          +₹{row.amount.toLocaleString()}
        </span>
      ) : '—'
    },
    {
      header: 'Credit (Bank Out)',
      accessorKey: 'amount',
      cell: (row: LedgerItem) => row.type === 'payment' ? (
        <span className="font-bold text-error">
          -₹{row.amount.toLocaleString()}
        </span>
      ) : '—'
    },
    {
      header: 'Running Balance',
      accessorKey: 'runningBalance',
      cell: (row: LedgerItem) => (
        <span className="font-bold text-foreground">
          ₹{row.runningBalance.toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Bank Book Ledger</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage Net Banking, UPI, and Cheque clearances.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchBankbook} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bankbook balance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Bank Receipts" value={`₹ ${summary.totalBankIn.toLocaleString()}`} icon={Wallet} colorTheme="success" />
        <StatsCard title="Total Bank Outflow" value={`₹ ${summary.totalBankOut.toLocaleString()}`} icon={Wallet} colorTheme="error" />
        <StatsCard title="Current Bank Balance" value={`₹ ${summary.currentBalance.toLocaleString()}`} icon={CreditCard} colorTheme="blue" />
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bank transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading transactions...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLedger}
        />
      )}
    </div>
  );
}
