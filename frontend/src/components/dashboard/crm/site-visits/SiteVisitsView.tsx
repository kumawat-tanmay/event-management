'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, MapPin, Eye, Edit, Trash2, Search, Filter, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const DUMMY_VISITS = [
  { id: 'SV-1001', leadId: 'LD-1002', venue: 'Shiv Vilas, Jaipur', customerName: 'Anjali Sharma', date: '15 Jul 2026', time: '11:00 AM', supervisor: 'Amit', status: 'Pending' },
  { id: 'SV-1002', leadId: 'LD-1005', venue: 'Fairmont Hotel', customerName: 'TechCorp Pvt Ltd', date: '14 Jul 2026', time: '02:30 PM', supervisor: 'Ravi', status: 'Completed' },
  { id: 'SV-1003', leadId: 'LD-1008', venue: 'Rambagh Palace', customerName: 'Vikram Singh', date: '16 Jul 2026', time: '10:00 AM', supervisor: 'Suresh', status: 'Pending' },
];

export function SiteVisitsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL VISITS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL VISITS', 'PENDING', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_VISITS);
      setLoading(false);
    }, 500);
  }, []);

  const confirmDelete = () => {
    if (visitToDelete) {
      setData(data.filter(v => v.id !== visitToDelete));
      setDeleteModalOpen(false);
      setVisitToDelete(null);
    }
  };

  const filteredData = data.filter(v => {
    const matchesSearch = v.venue.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'ALL VISITS' ? true : v.status.toUpperCase() === activeTab;

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: 'Visit ID', 
      accessorKey: 'id', 
      cell: (row: any) => (
        <div>
          <span className="font-medium text-primary">{row.id}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Ref: {row.leadId}</p>
        </div>
      ) 
    },
    { 
      header: 'Venue & Customer', 
      accessorKey: 'venue', 
      cell: (row: any) => (
        <div>
          <p className="font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            {row.venue}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.customerName}</p>
        </div>
      ) 
    },
    { 
      header: 'Schedule', 
      accessorKey: 'date',
      cell: (row: any) => (
        <div>
          <p className="font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {row.date}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {row.time}
          </p>
        </div>
      )
    },
    { 
      header: 'Assigned To', 
      accessorKey: 'supervisor',
      cell: (row: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
          <Users className="w-3 h-3" />
          {row.supervisor}
        </span>
      )
    },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/crm/site-visits/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/site-visits/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setVisitToDelete(row.id);
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Site Visits</h2>
          <p className="text-sm font-medium text-muted-foreground">Schedule venue inspections and gather measurements.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Link href="/crm/site-visits/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Schedule Visit</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Scheduled"
          value={data.length}
          icon={MapPin}
          colorTheme="primary"
        />
        <StatsCard
          title="Pending Today"
          value={data.filter(v => v.status === 'Pending').length}
          icon={Clock}
          colorTheme="warning"
        />
        <StatsCard
          title="Completed"
          value={data.filter(v => v.status === 'Completed').length}
          icon={CheckCircle}
          colorTheme="success"
        />
        <StatsCard
          title="Active Supervisors"
          value="3"
          icon={Users}
          colorTheme="secondary"
        />
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <MapPin className="w-5 h-5 text-primary" />
            Site Visits List
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
              placeholder="Search by venue or supervisor..."
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
        title="Cancel Site Visit"
        message="Are you sure you want to delete this scheduled site visit?"
        confirmText="Yes, Delete"
      />
    </div>
  );
}
