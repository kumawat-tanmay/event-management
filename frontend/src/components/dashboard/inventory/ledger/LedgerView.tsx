'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Search, ArrowRightLeft, Download, ArrowDownRight, ArrowUpRight, ListOrdered, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import { inventoryService, LedgerEntry } from '@/lib/services/inventory.services';
import { useTranslation } from 'react-i18next';

export function LedgerView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL TYPES');
  const tabs = ['ALL TYPES', 'STOCK IN', 'STOCK OUT'];

  // Fetch all ledger movements
  const { data: ledgerResponse, error, isLoading } = useSWR('ledger-list', () => 
    inventoryService.getLedger({ limit: 100 })
  );

  const movements = ledgerResponse?.data || [];

  const filteredData = movements.filter(item => {
    const itemName = typeof item.item === 'object' && item.item !== null ? item.item.name : '';
    const refCode = item.reference || '';
    const transId = item._id || '';

    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          refCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'ALL TYPES' || 
                       (activeTab === 'STOCK IN' && ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED', 'TRANSFER_IN', 'RELEASED'].includes(item.type)) || 
                       (activeTab === 'STOCK OUT' && ['STOCK_OUT', 'DAMAGED', 'SCRAPPED', 'TRANSFER_OUT', 'RESERVED'].includes(item.type));

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: t('ledger.transactionId', 'Transaction ID'), 
      accessorKey: '_id', 
      cell: (row: LedgerEntry) => <span className="font-mono text-xs text-muted-foreground">{row._id.slice(-8).toUpperCase()}</span> 
    },
    { 
      header: t('ledger.dateTime', 'Date & Time'), 
      accessorKey: 'createdAt', 
      cell: (row: LedgerEntry) => <span className="text-sm">{new Date(row.createdAt).toLocaleString()}</span> 
    },
    { 
      header: t('ledger.item', 'Item'), 
      accessorKey: 'item', 
      cell: (row: LedgerEntry) => (
        <span className="font-semibold text-primary">
          {typeof row.item === 'object' && row.item !== null ? row.item.name : '—'}
        </span>
      ) 
    },
    { 
      header: t('ledger.type', 'Type'), 
      accessorKey: 'type', 
      cell: (row: LedgerEntry) => {
        let isAddition = false;
        if (row.type === 'ADJUSTMENT') {
          isAddition = row.balanceAfter > row.balanceBefore;
        } else {
          isAddition = ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED', 'TRANSFER_IN', 'RELEASED'].includes(row.type);
        }
        return (
          <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-1 rounded border uppercase ${
            isAddition ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
            'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {isAddition ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {row.type.replace('_', ' ')}
          </span>
        );
      }
    },
    { 
      header: t('ledger.qty', 'Qty'), 
      accessorKey: 'quantity', 
      cell: (row: LedgerEntry) => {
        let isAddition = false;
        if (row.type === 'ADJUSTMENT') {
          isAddition = row.balanceAfter > row.balanceBefore;
        } else {
          isAddition = ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED', 'TRANSFER_IN', 'RELEASED'].includes(row.type);
        }
        return (
          <span className={isAddition ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
            {isAddition ? '+' : '-'}{row.quantity}
          </span>
        );
      }
    },
    { 
      header: t('ledger.reference', 'Reference'), 
      accessorKey: 'reference', 
      cell: (row: LedgerEntry) => <span className="font-semibold text-foreground">{row.reference || '—'}</span> 
    },
    { 
      header: t('ledger.warehouse', 'Warehouse'), 
      accessorKey: 'warehouse', 
      cell: (row: LedgerEntry) => <span className="text-muted-foreground">{typeof row.warehouse === 'object' && row.warehouse !== null ? row.warehouse.name : '—'}</span> 
    },
    { 
      header: t('ledger.user', 'User'), 
      accessorKey: 'performedBy', 
      cell: (row: LedgerEntry) => <span>{typeof row.performedBy === 'object' && row.performedBy !== null ? row.performedBy.name : '—'}</span> 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load ledger logs.')}
      </div>
    );
  }

  // Calculate stats
  const totalCount = movements.length;
  const stockInCount = movements.filter(m => ['STOCK_IN', 'OPENING_STOCK', 'REPAIRED'].includes(m.type)).length;
  const stockOutCount = movements.filter(m => ['STOCK_OUT', 'DAMAGED', 'SCRAPPED'].includes(m.type)).length;
  const adjustmentsCount = movements.filter(m => ['ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(m.type)).length;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-primary" />
            {t('ledger.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">{t('ledger.subtitle')}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('ledger.totalTransactions')}
          value={totalCount}
          icon={ArrowRightLeft}
          subtitle="All transactions log"
          colorTheme="primary"
        />
        <StatsCard
          title={t('ledger.stockIn')}
          value={stockInCount}
          icon={ArrowDownRight}
          subtitle="Receipts / returns"
          colorTheme="success"
        />
        <StatsCard
          title={t('ledger.stockOut')}
          value={stockOutCount}
          icon={ArrowUpRight}
          subtitle="Dispatches / losses"
          colorTheme="blue"
        />
        <StatsCard
          title={t('ledger.internalTransfers')}
          value={adjustmentsCount}
          icon={ListOrdered}
          subtitle="Inter-warehouse"
          colorTheme="warning"
        />
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <ListOrdered className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{t('ledger.listTitle')}</h3>
              </div>
              
              <div className="flex items-center justify-center w-full lg:w-1/3">
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit overflow-x-auto max-w-[calc(100vw-2rem)] no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
                        activeTab === tab
                          ? "bg-primary text-on-primary shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                      )}
                    >
                      {tab === 'ALL TYPES' ? t('ledger.allTypes') : tab === 'STOCK IN' ? t('ledger.stockIn') : t('ledger.stockOut')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full lg:w-1/3 flex justify-end">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder={t('ledger.searchPlace')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
              </div>
            </div>
          }
          className="border-none shadow-none"
        />
      </div>
    </div>
  );
}
