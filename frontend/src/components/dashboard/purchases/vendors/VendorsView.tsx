'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Users, Eye, Edit, Truck, Star, Phone, Trash2, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { cn } from '@/utils/cn';

const DUMMY_VENDORS = [
  { id: '1', name: 'Ramesh Tents & Decorators', type: 'Tents & Furniture', contact: '+91 9876543210', pendingDue: 45000, status: 'Active' },
  { id: '2', name: 'Shiva Caterers', type: 'Catering', contact: '+91 9876543211', pendingDue: 120000, status: 'Payment Overdue' },
  { id: '3', name: 'Balaji Sound & Light', type: 'AV & Lighting', contact: '+91 9876543212', pendingDue: 0, status: 'Active' },
];

export function VendorsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL VENDORS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const tabs = ['ALL VENDORS', 'ACTIVE', 'PAYMENT OVERDUE'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_VENDORS);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (vendorToDelete) {
      setData(data.filter(vendor => vendor.id !== vendorToDelete));
      setDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };

  const filteredData = data.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL VENDORS' ? true : v.status.toUpperCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: 'Vendor Name', 
      accessorKey: 'name', 
      cell: (row: any) => (
        <span className="font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          {row.name}
        </span>
      ) 
    },
    { header: 'Service Type', accessorKey: 'type', cell: (row: any) => <span className="font-medium text-muted-foreground">{row.type}</span> },
    { 
      header: 'Contact', 
      accessorKey: 'contact', 
      cell: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span>{row.contact}</span>
        </div>
      ) 
    },
    { 
      header: 'Pending Due', 
      accessorKey: 'pendingDue', 
      cell: (row: any) => (
        <span className={`font-bold ${row.pendingDue > 0 ? 'text-error' : 'text-emerald-600'}`}>
          ₹ {row.pendingDue.toLocaleString()}
        </span>
      ) 
    },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/vendors/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <ActionGuard permission="purchases.update">
            <Link href={`/vendors/${row.id}/edit`}>
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
                setVendorToDelete(row.id);
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Vendor Management</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage external vendors, cross-rentals, and payments.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <ActionGuard permission="purchases.create">
            <Link href="/vendors/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Add Vendor</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Vendors"
          value={data.length}
          icon={Users}
          subtitle="+12%"
          colorTheme="primary"
        />
        <StatsCard
          title="Total Pending Due"
          value="₹ 1.65L"
          icon={Truck}
          subtitle="Critical"
          colorTheme="error"
        />
        <StatsCard
          title="Avg. Rating"
          value="4.8/5"
          icon={Star}
          subtitle="Excellent"
          colorTheme="yellow"
        />
        <StatsCard
          title="Active Cross-Rentals"
          value="8"
          icon={Users}
          subtitle="Active"
          colorTheme="blue"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search vendors or services..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Vendor Directory</h3>
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
                    placeholder="Search vendors..." 
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
          setVendorToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone and will remove the vendor record permanently."
        confirmText="Delete Vendor"
      />
    </div>
  );
}
