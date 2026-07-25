'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Users, Eye, Edit, Building2, Briefcase, Trash2, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const DUMMY_CUSTOMERS = [
  { id: '1', name: 'Ramesh Sharma', type: 'Retail', phone: '+91 9829012345', activeBookings: 1, outstanding: 0, status: 'Active' },
  { id: '2', name: 'Royal Weddings Agency', type: 'Corporate', phone: '+91 9829054321', activeBookings: 3, outstanding: 150000, status: 'Active' },
  { id: '3', name: 'Fairmont Hotel', type: 'Corporate', phone: '+91 9829098765', activeBookings: 2, outstanding: 45000, status: 'Payment Overdue' },
  { id: '4', name: 'Sunita Verma', type: 'Retail', phone: '+91 9829011111', activeBookings: 0, outstanding: 0, status: 'Inactive' },
];

export function CustomersView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const tabs = ['ALL CUSTOMERS', 'RETAIL', 'CORPORATE', 'PAYMENT OVERDUE'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_CUSTOMERS);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (customerToDelete) {
      setData(data.filter(c => c.id !== customerToDelete));
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const filteredData = data.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery);
    
    let matchesTab = true;
    if (activeTab === 'RETAIL') matchesTab = c.type === 'Retail';
    if (activeTab === 'CORPORATE') matchesTab = c.type === 'Corporate';
    if (activeTab === 'PAYMENT OVERDUE') matchesTab = c.status === 'Payment Overdue';

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: 'Customer Name', 
      accessorKey: 'name', 
      cell: (row: any) => (
        <span className="font-bold text-foreground flex items-center gap-2">
          {row.type === 'Corporate' ? <Building2 className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
          {row.name}
        </span>
      ) 
    },
    { 
      header: 'Type', 
      accessorKey: 'type', 
      cell: (row: any) => (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.type === 'Corporate' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {row.type}
        </span>
      ) 
    },
    { header: 'Phone', accessorKey: 'phone' },
    { 
      header: 'Active Bookings', 
      accessorKey: 'activeBookings',
      cell: (row: any) => <span className="font-medium">{row.activeBookings}</span>
    },
    { 
      header: 'Outstanding (₹)', 
      accessorKey: 'outstanding', 
      cell: (row: any) => (
        <span className={`font-bold ${row.outstanding > 0 ? 'text-error' : 'text-emerald-600'}`}>
          ₹ {row.outstanding.toLocaleString()}
        </span>
      ) 
    },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/crm/customers/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/customers/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setCustomerToDelete(row.id);
              setDeleteModalOpen(true);
            }}
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Customers</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage your retail clients and corporate agency accounts.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/crm/customers/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Customer</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Customers"
          value={data.length}
          icon={Users}
          colorTheme="primary"
        />
        <StatsCard
          title="Corporate Clients"
          value={data.filter(c => c.type === 'Corporate').length}
          icon={Building2}
          colorTheme="secondary"
        />
        <StatsCard
          title="Active Bookings"
          value={data.reduce((acc, curr) => acc + curr.activeBookings, 0)}
          icon={Briefcase}
          colorTheme="success"
        />
        <StatsCard
          title="Total Outstanding"
          value={`₹ ${(data.reduce((acc, curr) => acc + curr.outstanding, 0) / 100000).toFixed(2)}L`}
          icon={Users}
          subtitle="Requires attention"
          colorTheme="error"
        />
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Users className="w-5 h-5 text-primary" />
            Customer List
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
              placeholder="Search customers..."
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
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This will also remove their quotation history but active bookings will remain."
        confirmText="Delete Customer"
      />
    </div>
  );
}
