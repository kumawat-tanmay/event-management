'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Users, Eye, Edit, Trash2, Search, Filter, MessageSquare, PhoneCall, MapPin, FileText, CheckCircle } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const DUMMY_LEADS = [
  { id: 'LD-1001', customerName: 'Rahul Verma', phone: '+91 9876543210', eventType: 'Wedding', date: '15 Oct 2026', source: 'Instagram', stage: 'New' },
  { id: 'LD-1002', customerName: 'Anjali Sharma', phone: '+91 9876543211', eventType: 'Birthday', date: '22 Nov 2026', source: 'Reference', stage: 'Site Visit' },
  { id: 'LD-1003', customerName: 'TechCorp Pvt Ltd', phone: '+91 9876543212', eventType: 'Corporate', date: '05 Dec 2026', source: 'Website', stage: 'Quotation' },
  { id: 'LD-1004', customerName: 'Vikram Singh', phone: '+91 9876543213', eventType: 'Wedding', date: '12 Dec 2026', source: 'Walk-in', stage: 'Booked' },
];

export function LeadsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL LEADS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL LEADS', 'NEW', 'SITE VISIT', 'QUOTATION', 'BOOKED', 'LOST'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_LEADS);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (leadToDelete) {
      setData(data.filter(l => l.id !== leadToDelete));
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  const filteredData = data.filter(l => {
    const matchesSearch = l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.phone.includes(searchQuery) ||
                          l.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'ALL LEADS' ? true : l.stage.toUpperCase() === activeTab;

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: 'Lead ID', 
      accessorKey: 'id', 
      cell: (row: any) => <span className="font-medium text-primary">{row.id}</span> 
    },
    { 
      header: 'Customer', 
      accessorKey: 'customerName', 
      cell: (row: any) => (
        <div>
          <p className="font-bold">{row.customerName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <PhoneCall className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      ) 
    },
    { 
      header: 'Event Details', 
      accessorKey: 'eventType',
      cell: (row: any) => (
        <div>
          <p className="font-medium">{row.eventType}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.date}</p>
        </div>
      )
    },
    { header: 'Source', accessorKey: 'source', cell: (row: any) => <span className="text-muted-foreground">{row.source}</span> },
    { 
      header: 'Stage', 
      accessorKey: 'stage', 
      cell: (row: any) => {
        let statusText = row.stage;
        let mappedStatus = 'Pending';
        if (statusText === 'New') mappedStatus = 'Pending';
        if (statusText === 'Site Visit') mappedStatus = 'In Progress';
        if (statusText === 'Quotation') mappedStatus = 'Review';
        if (statusText === 'Booked') mappedStatus = 'Confirmed';
        if (statusText === 'Lost') mappedStatus = 'Cancelled';
        return <StatusBadge status={mappedStatus} customText={statusText} />;
      }
    },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" title="WhatsApp">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Link href={`/crm/leads/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/leads/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setLeadToDelete(row.id);
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Sales Leads</h2>
          <p className="text-sm font-medium text-muted-foreground">Track incoming inquiries and manage the sales pipeline.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Link href="/crm/leads/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Lead</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Leads"
          value={data.length}
          icon={Users}
          colorTheme="primary"
        />
        <StatsCard
          title="Pending Site Visits"
          value={data.filter(l => l.stage === 'Site Visit' || l.stage === 'New').length}
          icon={MapPin}
          colorTheme="secondary"
        />
        <StatsCard
          title="Quotations Sent"
          value={data.filter(l => l.stage === 'Quotation').length}
          icon={FileText}
          colorTheme="warning"
        />
        <StatsCard
          title="Converted to Booking"
          value={data.filter(l => l.stage === 'Booked').length}
          icon={CheckCircle}
          colorTheme="success"
        />
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Users className="w-5 h-5 text-primary" />
            Leads List
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
              placeholder="Search leads..."
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
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete Lead"
      />
    </div>
  );
}
