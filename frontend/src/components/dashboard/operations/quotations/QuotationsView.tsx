'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, FileText, Eye, Edit, Trash2, Search, CheckCircle, Clock, CalendarDays, FileCheck, IndianRupee } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const DUMMY_QUOTATIONS = [
  { id: 'QT-2026-001', customer: 'Ramesh Sharma', customerType: 'Retail', startDate: '2026-10-15', endDate: '2026-10-18', amount: 150000, status: 'Approved' },
  { id: 'QT-2026-002', customer: 'Royal Weddings Agency', customerType: 'Corporate', startDate: '2026-11-20', endDate: '2026-11-22', amount: 450000, status: 'Draft' },
  { id: 'QT-2026-003', customer: 'Fairmont Hotel', customerType: 'Corporate', startDate: '2026-12-05', endDate: '2026-12-06', amount: 85000, status: 'Sent' },
  { id: 'QT-2026-004', customer: 'Sunita Verma', customerType: 'Retail', startDate: '2026-10-25', endDate: '2026-10-25', amount: 25000, status: 'Converted' },
];

export function QuotationsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const tabs = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'CONVERTED'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_QUOTATIONS);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (quoteToDelete) {
      setData(data.filter(q => q.id !== quoteToDelete));
      setDeleteModalOpen(false);
      setQuoteToDelete(null);
    }
  };

  const filteredData = data.filter(q => {
    const matchesSearch = q.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab !== 'ALL') {
      matchesTab = q.status.toUpperCase() === activeTab;
    }

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: 'Quotation ID', 
      accessorKey: 'id', 
      cell: (row: any) => (
        <span className="font-mono text-sm font-bold text-foreground">
          {row.id}
        </span>
      ) 
    },
    { 
      header: 'Customer', 
      accessorKey: 'customer', 
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground">{row.customer}</p>
          <span className="text-xs text-muted-foreground">{row.customerType}</span>
        </div>
      ) 
    },
    { 
      header: 'Event Dates', 
      accessorKey: 'dates', 
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span>{row.startDate} to {row.endDate}</span>
        </div>
      ) 
    },
    { 
      header: 'Amount (₹)', 
      accessorKey: 'amount', 
      cell: (row: any) => (
        <span className="font-bold text-foreground">
          ₹ {row.amount.toLocaleString()}
        </span>
      ) 
    },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/operations/quotations/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/operations/quotations/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" disabled={row.status === 'Converted'}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setQuoteToDelete(row.id);
              setDeleteModalOpen(true);
            }}
            disabled={row.status === 'Converted'}
            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Quotations</h2>
          <p className="text-sm font-medium text-muted-foreground">Create and manage event estimates and proposals.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/operations/quotations/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Create Quotation</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Quotations"
          value={data.length}
          icon={FileText}
          colorTheme="primary"
        />
        <StatsCard
          title="Pending Approval"
          value={data.filter(q => q.status === 'Sent' || q.status === 'Draft').length}
          icon={Clock}
          colorTheme="secondary"
        />
        <StatsCard
          title="Converted to Booking"
          value={data.filter(q => q.status === 'Converted').length}
          icon={CheckCircle}
          colorTheme="success"
        />
        <StatsCard
          title="Total Pipeline Value"
          value={`₹ ${(data.reduce((acc, curr) => acc + curr.amount, 0) / 100000).toFixed(2)}L`}
          icon={IndianRupee}
          colorTheme="primary"
        />
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <FileCheck className="w-5 h-5 text-primary" />
            Quotations List
          </div>
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredData}
          />
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete Quotation"
      />
    </div>
  );
}
