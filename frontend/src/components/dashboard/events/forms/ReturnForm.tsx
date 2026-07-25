'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  RotateCcw, CalendarDays, CheckCircle2, 
  AlertTriangle, Truck, RefreshCw, XCircle, Search
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { cn } from '@/utils/cn';

export function ReturnForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL RETURNS');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['ALL RETURNS', 'INWARD', 'COMPLETED'];

  // Dummy Data for Return Checklists
  const [returnLists, setReturnLists] = useState([
    {
      id: 'RET-001',
      eventId: 'EVT-2026-089',
      eventName: 'Aditi & Rahul Royal Wedding',
      teardownDate: '18 Oct 2026, 06:00 AM',
      itemsDispatched: 145,
      itemsReturned: 140,
      itemsDamaged: 5,
      status: 'Inward Processing'
    },
    {
      id: 'RET-002',
      eventId: 'EVT-2026-071',
      eventName: 'Sharma Family Haldi',
      teardownDate: '02 Oct 2026, 08:00 AM',
      itemsDispatched: 45,
      itemsReturned: 45,
      itemsDamaged: 0,
      status: 'Completed'
    },
    {
      id: 'RET-003',
      eventId: 'EVT-2026-068',
      eventName: 'Corporate Excellence Awards',
      teardownDate: '28 Sep 2026, 11:00 PM',
      itemsDispatched: 320,
      itemsReturned: 300,
      itemsDamaged: 15,
      status: 'Discrepancy'
    }
  ]);

  const filteredData = returnLists.filter(t => {
    if (activeTab === 'ALL RETURNS') return true;
    if (activeTab === 'INWARD') return t.status !== 'Completed';
    if (activeTab === 'COMPLETED') return t.status === 'Completed';
    return true;
  });

  const columns = [
    { 
      header: 'Return ID', 
      accessorKey: 'id', 
      cell: (row: any) => <span className="font-medium text-foreground">{row.id}</span> 
    },
    { 
      header: 'Event Source', 
      accessorKey: 'eventName', 
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => router.push(`/events/return/${row.eventId}`)}>
            {row.eventName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.eventId}</p>
        </div>
      ) 
    },
    { 
      header: 'Teardown Date', 
      accessorKey: 'teardownDate', 
      cell: (row: any) => (
        <div className="flex items-center text-foreground font-medium">
          <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          {row.teardownDate}
        </div>
      ) 
    },
    { 
      header: 'Recovery Status', 
      accessorKey: 'recovery', 
      cell: (row: any) => (
        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{row.itemsReturned}/{row.itemsDispatched} Recovered</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${row.itemsReturned === row.itemsDispatched ? 'bg-success' : 'bg-primary'}`} 
              style={{ width: `${(row.itemsReturned / row.itemsDispatched) * 100}%` }}
            ></div>
          </div>
          <div className="mt-1">
            <StatusBadge status={row.status} />
          </div>
        </div>
      ) 
    },
    { 
      header: 'Damages', 
      accessorKey: 'damages', 
      cell: (row: any) => (
        row.itemsDamaged > 0 ? (
          <div className="flex items-center text-error font-medium">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            {row.itemsDamaged} Items
          </div>
        ) : (
          <div className="flex items-center text-success font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            No Damage
          </div>
        )
      ) 
    },
    {
      header: 'Actions', 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end">
          <Button 
            variant={row.status === 'Completed' ? 'outline' : 'primary'} 
            size="sm"
            onClick={() => router.push(`/events/return/${row.id}`)}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            {row.status === 'Completed' ? 'View Log' : 'Process Return'}
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Return & Damages</h2>
          <p className="text-sm font-medium text-muted-foreground">Process incoming inventory after events, log damages, and report discrepancies.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Awaiting Return"
          value={5}
          icon={Truck}
          subtitle="Action Needed"
          colorTheme="primary"
        />
        <StatsCard
          title="Processing (Inward)"
          value={1}
          icon={RefreshCw}
          subtitle="Active"
          colorTheme="yellow"
        />
        <StatsCard
          title="Damages Logged"
          value={20}
          icon={XCircle}
          subtitle="Critical"
          colorTheme="error"
        />
        <StatsCard
          title="Completed Returns"
          value={18}
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
          searchPlaceholder="Search event or return ID..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <RotateCcw className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Return Processing</h3>
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
                    placeholder="Search event or return ID..." 
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
