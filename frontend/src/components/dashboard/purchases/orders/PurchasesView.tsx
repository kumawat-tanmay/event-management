'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, FileText, Eye, Edit, Trash2, IndianRupee, ShoppingBag, Clock, ShoppingCart, DollarSign, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { cn } from '@/utils/cn';

const DUMMY_PURCHASES = [
  { id: '1', poNumber: 'PO-2025-045', vendor: 'Ramesh Tents', date: '15 May 2025', amount: 25000, status: 'Pending' },
  { id: '2', poNumber: 'PO-2025-042', vendor: 'Shiva Caterers', date: '10 May 2025', amount: 15000, status: 'Approved' },
  { id: '3', poNumber: 'PO-2025-041', vendor: 'Balaji Sound', date: '08 May 2025', amount: 45000, status: 'Received' },
];

export function PurchasesView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL POs');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<string | null>(null);
  const tabs = ['ALL POs', 'PENDING APPROVAL', 'APPROVED', 'RECEIVED'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_PURCHASES);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (poToDelete) {
      setData(data.filter(po => po.id !== poToDelete));
      setDeleteModalOpen(false);
      setPoToDelete(null);
    }
  };

  const filteredData = data.filter(p => {
    const matchesSearch = p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL POs' ? true : p.status.toUpperCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: 'PO Number',
      accessorKey: 'poNumber',
      cell: (row: any) => (
        <span className="font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          {row.poNumber}
        </span>
      )
    },
    { header: 'Vendor', accessorKey: 'vendor', cell: (row: any) => <span className="font-semibold">{row.vendor}</span> },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Amount', accessorKey: 'amount', cell: (row: any) => `₹ ${row.amount.toLocaleString()}` },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/purchases/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <ActionGuard permission="purchases.update">
            <Link href={`/purchases/${row.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>
          <ActionGuard permission="purchases.delete">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setPoToDelete(row.id);
                setDeleteModalOpen(true);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Purchase Orders</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage purchase requests, POs, and goods receiving.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <ActionGuard permission="purchases.create">
            <Link href="/purchases/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Create PO</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Purchases"
          value={data.length}
          icon={ShoppingCart}
          subtitle="+8.4%"
          colorTheme="primary"
        />
        <StatsCard
          title="Pending Approval"
          value={data.filter(d => d.status === 'Pending').length}
          icon={Clock}
          subtitle="Needs Action"
          colorTheme="yellow"
        />
        <StatsCard
          title="Approved POs"
          value={data.filter(d => d.status === 'Approved').length}
          icon={ShoppingBag}
          subtitle="Approved"
          colorTheme="blue"
        />
        <StatsCard
          title="Total Amount"
          value="₹ 4.52L"
          icon={DollarSign}
          subtitle="On Track"
          colorTheme="secondary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search POs or Vendors..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Purchase Log</h3>
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
                    placeholder="Search POs or Vendors..."
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

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPoToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action cannot be undone and will remove the PO record permanently."
        confirmText="Delete PO"
      />
    </div>
  );
}
