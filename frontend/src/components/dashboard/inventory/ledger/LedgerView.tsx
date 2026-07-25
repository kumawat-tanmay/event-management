'use client';

import React, { useState } from 'react';
import { Search, Filter, ArrowRightLeft, Download, ArrowDownRight, ArrowUpRight, ListOrdered } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';

const DUMMY_LEDGER = [
  { id: 'TXN-001', date: '24 May 2025, 10:30 AM', item: 'German Tent 20x40', type: 'OUT', qty: 2, reference: 'DIS-2025-208', warehouse: 'Main Hub', user: 'Rahul' },
  { id: 'TXN-002', date: '24 May 2025, 09:15 AM', item: 'Banquet Chairs', type: 'IN', qty: 150, reference: 'RET-2025-109', warehouse: 'Main Hub', user: 'Amit' },
  { id: 'TXN-003', date: '23 May 2025, 04:45 PM', item: 'Fairy Lights (100m)', type: 'OUT', qty: 5, reference: 'DIS-2025-207', warehouse: 'Sec-4 Godown', user: 'Rahul' },
  { id: 'TXN-004', date: '23 May 2025, 02:20 PM', item: 'Sofa 3-Seater VIP', type: 'IN', qty: 4, reference: 'RET-2025-108', warehouse: 'Main Hub', user: 'Suresh' },
  { id: 'TXN-005', date: '22 May 2025, 11:00 AM', item: 'JBL Speakers Set', type: 'OUT', qty: 1, reference: 'DIS-2025-206', warehouse: 'Tech Hub', user: 'Vikram' },
];

export function LedgerView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data] = useState(DUMMY_LEDGER);
  const [activeTab, setActiveTab] = useState('ALL TYPES');
  const tabs = ['ALL TYPES', 'STOCK IN', 'STOCK OUT'];

  const filteredData = data.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL TYPES' || 
                       (activeTab === 'STOCK IN' && item.type === 'IN') || 
                       (activeTab === 'STOCK OUT' && item.type === 'OUT');
    return matchesSearch && matchesTab;
  });

  const columns = [
    { header: 'Transaction ID', accessorKey: 'id', cell: (row: any) => <span className="font-semibold text-muted-foreground">{row.id}</span> },
    { header: 'Date & Time', accessorKey: 'date', cell: (row: any) => <span className="text-sm">{row.date}</span> },
    { header: 'Item', accessorKey: 'item', cell: (row: any) => <span className="font-semibold text-primary">{row.item}</span> },
    { header: 'Type', accessorKey: 'type', cell: (row: any) => (
        <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-1 rounded border ${
          row.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }`}>
          {row.type === 'IN' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
          {row.type}
        </span>
      )
    },
    { header: 'Qty', accessorKey: 'qty', cell: (row: any) => <span className="font-semibold">{row.type === 'OUT' ? '-' : '+'}{row.qty}</span> },
    { header: 'Reference', accessorKey: 'reference', cell: (row: any) => <span className="font-medium cursor-pointer hover:underline text-foreground">{row.reference}</span> },
    { header: 'Warehouse', accessorKey: 'warehouse', cell: (row: any) => <span className="text-muted-foreground">{row.warehouse}</span> },
    { header: 'User', accessorKey: 'user', cell: (row: any) => <span>{row.user}</span> },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-primary" />
            Inventory Ledger
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Track all stock movements, dispatches, and returns</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Export Log</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Transactions"
          value="1,248"
          icon={ArrowRightLeft}
          subtitle="This Month"
          colorTheme="primary"
        />
        <StatsCard
          title="Stock In"
          value="+420"
          icon={ArrowDownRight}
          subtitle="Returns/Purchases"
          colorTheme="success"
        />
        <StatsCard
          title="Stock Out"
          value="-512"
          icon={ArrowUpRight}
          subtitle="Dispatched"
          colorTheme="blue"
        />
        <StatsCard
          title="Lost/Damaged"
          value="12"
          icon={Filter}
          subtitle="Action Needed"
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
                <h3 className="text-lg font-bold text-foreground">Stock Ledger Log</h3>
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
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full lg:w-1/3 flex justify-end">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search by Item, Ref or ID..." 
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
