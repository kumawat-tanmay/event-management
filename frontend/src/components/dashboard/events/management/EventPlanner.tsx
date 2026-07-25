'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ClipboardList, Users, CheckCircle2, AlertCircle, 
  CalendarDays, MapPin, Eye, Edit, Trash2, ArrowRight, Search
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { cn } from '@/utils/cn';

export function EventPlanner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL TASKS');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['ALL TASKS', 'PENDING', 'FULLY PLANNED'];

  const [planningTasks, setPlanningTasks] = useState([
    {
      id: 'EVT-2026-089',
      name: 'Aditi & Rahul Royal Wedding',
      date: '15 Oct 2026',
      venue: 'Fairmont Hotel, Jaipur',
      staffAssigned: 12,
      staffRequired: 15,
      vendorsConfirmed: 4,
      vendorsRequired: 5,
      status: 'Action Needed'
    },
    {
      id: 'EVT-2026-092',
      name: 'TechCorp Annual Summit',
      date: '22 Oct 2026',
      venue: 'JECC, Jaipur',
      staffAssigned: 20,
      staffRequired: 20,
      vendorsConfirmed: 8,
      vendorsRequired: 8,
      status: 'Fully Planned'
    },
    {
      id: 'EVT-2026-095',
      name: 'Ramesh 50th Birthday',
      date: '05 Nov 2026',
      venue: 'Rambagh Palace, Jaipur',
      staffAssigned: 0,
      staffRequired: 8,
      vendorsConfirmed: 0,
      vendorsRequired: 3,
      status: 'Unplanned'
    }
  ]);

  const filteredData = planningTasks.filter(t => {
    if (activeTab === 'ALL TASKS') return true;
    if (activeTab === 'PENDING') return t.status !== 'Fully Planned';
    if (activeTab === 'FULLY PLANNED') return t.status === 'Fully Planned';
    return true;
  });

  const columns = [
    { 
      header: 'Event Target', 
      accessorKey: 'name', 
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/events/${row.id}`} className="text-xs font-bold text-primary hover:underline">{row.id}</Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center">
              <CalendarDays className="w-3 h-3 mr-1" />
              {row.date}
            </span>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Staff Assignment', 
      accessorKey: 'staffAssigned', 
      cell: (row: any) => (
        <div className="flex flex-col items-start sm:items-center">
          <span className={`text-sm font-bold ${row.staffAssigned < row.staffRequired ? 'text-error' : 'text-success'}`}>
            {row.staffAssigned} / {row.staffRequired}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase mt-0.5">Assigned</span>
        </div>
      ) 
    },
    { 
      header: 'Vendor Booking', 
      accessorKey: 'vendorsConfirmed', 
      cell: (row: any) => (
        <div className="flex flex-col items-start sm:items-center">
          <span className={`text-sm font-bold ${row.vendorsConfirmed < row.vendorsRequired ? 'text-error' : 'text-success'}`}>
            {row.vendorsConfirmed} / {row.vendorsRequired}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase mt-0.5">Confirmed</span>
        </div>
      ) 
    },
    { 
      header: 'Planning Status', 
      accessorKey: 'status', 
      cell: (row: any) => (
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
          row.status === 'Fully Planned' ? 'bg-success/10 text-success border border-success/20' : 
          row.status === 'Unplanned' ? 'bg-error/10 text-error border border-error/20' : 
          'bg-warning/10 text-warning border border-warning/20'
        }`}>
          {row.status}
        </span>
      ) 
    },
    {
      header: 'Actions', 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/events/planner/${row.id}`)}
            className="h-8"
          >
            Manage
            <ArrowRight className="w-4 h-4 ml-1" />
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Event Planning</h2>
          <p className="text-sm font-medium text-muted-foreground">Assign staff, vendors, and manage resources for upcoming events.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Unplanned Events"
          value={1}
          icon={AlertCircle}
          subtitle="Critical"
          colorTheme="error"
        />
        <StatsCard
          title="Pending Assignments"
          value={4}
          icon={Users}
          subtitle="Action Needed"
          colorTheme="yellow"
        />
        <StatsCard
          title="Fully Planned"
          value={1}
          icon={CheckCircle2}
          subtitle="On Track"
          colorTheme="success"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search planning tasks..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Planning Board</h3>
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
                    placeholder="Search planning tasks..." 
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
