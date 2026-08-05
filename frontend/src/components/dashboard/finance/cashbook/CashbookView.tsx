'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Wallet, Download, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { financeService, LedgerItem, CashbookSummary } from '@/lib/services/finance.services';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export function CashbookView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<CashbookSummary>({
    totalCashIn: 0,
    totalCashOut: 0,
    currentBalance: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCashbook = async () => {
    setLoading(true);
    try {
      const data = await financeService.getCashbook();
      setLedger(data.ledger || []);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error loading cashbook:', err);
      toast.error(t('finance.cashbook.noEntries'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashbook();
  }, []);

  const filteredLedger = ledger.filter(item => {
    const term = searchQuery.toLowerCase();
    return item.source.toLowerCase().includes(term) ||
           item.reference.toLowerCase().includes(term) ||
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
      header: t('finance.cashbook.cashIn'),
      accessorKey: 'amount',
      cell: (row: LedgerItem) => (row.type === 'receipt' && row.source !== 'Booking Refund') ? (
        <span className="font-bold text-success">
          +₹{row.amount.toLocaleString()}
        </span>
      ) : '—'
    },
    {
      header: t('finance.cashbook.cashOut'),
      accessorKey: 'amount',
      cell: (row: LedgerItem) => (row.type === 'payment' || row.source === 'Booking Refund') ? (
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
    },
    {
      header: 'Remarks',
      accessorKey: 'notes',
      cell: (row: LedgerItem) => <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{row.notes || '—'}</span>
    }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('finance.cashbook.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('finance.cashbook.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchCashbook} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cash book balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title={t('finance.cashbook.cashIn')} value={`₹ ${summary.totalCashIn.toLocaleString()}`} icon={Wallet} colorTheme="success" />
        <StatsCard title={t('finance.cashbook.cashOut')} value={`₹ ${summary.totalCashOut.toLocaleString()}`} icon={Wallet} colorTheme="error" />
        <StatsCard title={t('finance.cashbook.balance')} value={`₹ ${summary.currentBalance.toLocaleString()}`} icon={Wallet} colorTheme="warning" />
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('finance.cashbook.search')}
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
