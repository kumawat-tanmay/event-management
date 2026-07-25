'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus, CalendarDays, Eye, Edit, Trash2,
  MapPin, CheckCircle2, AlertTriangle, Clock, Search
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { cn } from '@/utils/cn';

export function EventsView() {
  const [activeTab, setActiveTab] = useState('ALL EVENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const tabs = ['ALL EVENTS', 'ACTIVE', 'COMPLETED'];

  // Dummy Data for Events Table
  const [eventsList, setEventsList] = useState([
    { id: 'EVT-2026-089', name: 'Aditi & Rahul Royal Wedding', type: 'Wedding', client: 'Aditi Sharma', startDate: '15 Oct 2026', venue: 'Fairmont Hotel, Jaipur', status: 'In Progress' },
    { id: 'EVT-2026-092', name: 'TechCorp Annual Summit', type: 'Corporate', client: 'TechCorp India', startDate: '22 Oct 2026', venue: 'JECC, Jaipur', status: 'Upcoming' },
    { id: 'EVT-2026-095', name: 'Ramesh 50th Birthday', type: 'Party', client: 'Ramesh Agarwal', startDate: '05 Nov 2026', venue: 'Rambagh Palace, Jaipur', status: 'Pending' },
    { id: 'EVT-2026-071', name: 'Sharma Family Haldi', type: 'Pre-Wedding', client: 'Neha Sharma', startDate: '01 Oct 2026', venue: 'The Lalit, Jaipur', status: 'Completed' },
  ]);

  const confirmDelete = () => {
    if (eventToDelete) {
      setEventsList(eventsList.filter(e => e.id !== eventToDelete));
      setDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  const filteredData = eventsList.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase());
    // In a real app, map 'ACTIVE' to 'In Progress' / 'Upcoming' etc.
    const matchesTab = activeTab === 'ALL EVENTS' ? true :
      activeTab === 'COMPLETED' ? e.status === 'Completed' :
        (e.status === 'In Progress' || e.status === 'Upcoming');
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: 'Event Details',
      accessorKey: 'name',
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/events/${row.id}`} className="text-xs font-bold text-primary hover:underline">{row.id}</Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {row.venue}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Client Info',
      accessorKey: 'client',
      cell: (row: any) => (
        <div>
          <p className="font-medium text-foreground">{row.client}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.type}</p>
        </div>
      )
    },
    {
      header: 'Start Date',
      accessorKey: 'startDate',
      cell: (row: any) => (
        <div className="flex items-center font-medium text-foreground">
          <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          {row.startDate}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/events/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/events/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEventToDelete(row.id);
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

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Events Management</h2>
          <p className="text-sm font-medium text-muted-foreground">Track and manage all your ongoing, upcoming, and past events.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/events/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">New Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Events"
          value={42}
          icon={CalendarDays}
          subtitle="+12%"
          colorTheme="primary"
        />
        <StatsCard
          title="In Progress"
          value={8}
          icon={Clock}
          subtitle="Active"
          colorTheme="yellow"
        />
        <StatsCard
          title="Pending Verification"
          value={3}
          icon={AlertTriangle}
          subtitle="Critical"
          colorTheme="error"
        />
        <StatsCard
          title="Completed"
          value={12}
          icon={CheckCircle2}
          subtitle="Excellent"
          colorTheme="success"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search events..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Events Directory</h3>
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
                    placeholder="Search events..."
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
          setEventToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
      />
    </div>
  );
}
