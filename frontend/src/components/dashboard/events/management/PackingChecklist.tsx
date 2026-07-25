'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, Truck, Clock, PackageCheck, ListChecks, Search
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';
import { cn } from '@/utils/cn';

export function PackingChecklist() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL DISPATCHES');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['ALL DISPATCHES', 'IN PROGRESS', 'DISPATCHED'];

  const [packingLists, setPackingLists] = useState([
    {
      id: 'DISP-001',
      eventId: 'EVT-2026-089',
      eventName: 'Aditi & Rahul Royal Wedding',
      dispatchDate: '14 Oct 2026, 06:00 AM',
      vehicle: 'Truck RJ-14-GH-1234',
      itemsPacked: 145,
      totalItems: 150,
      status: 'Packing in Progress'
    },
    {
      id: 'DISP-002',
      eventId: 'EVT-2026-092',
      eventName: 'TechCorp Annual Summit',
      dispatchDate: '21 Oct 2026, 08:00 AM',
      vehicle: 'Tempo RJ-14-KL-9876',
      itemsPacked: 80,
      totalItems: 80,
      status: 'Ready for Dispatch'
    },
    {
      id: 'DISP-003',
      eventId: 'EVT-2026-071',
      eventName: 'Sharma Family Haldi',
      dispatchDate: '30 Sep 2026, 10:00 PM',
      vehicle: 'Truck RJ-14-MN-5555',
      itemsPacked: 45,
      totalItems: 45,
      status: 'Dispatched'
    }
  ]);

  const filteredData = packingLists.filter(t => {
    if (activeTab === 'ALL DISPATCHES') return true;
    if (activeTab === 'IN PROGRESS') return t.status !== 'Dispatched';
    if (activeTab === 'DISPATCHED') return t.status === 'Dispatched';
    return true;
  });

  const columns = [
    { 
      header: 'Dispatch ID', 
      accessorKey: 'id', 
      cell: (row: any) => <span className="font-medium text-foreground">{row.id}</span> 
    },
    { 
      header: 'Event Target', 
      accessorKey: 'eventName', 
      cell: (row: any) => (
        <div>
          <p className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => router.push(`/events/packing/${row.eventId}`)}>
            {row.eventName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{row.eventId}</p>
        </div>
      ) 
    },
    { 
      header: 'Scheduled Dispatch', 
      accessorKey: 'dispatchDate', 
      cell: (row: any) => (
        <div className="flex items-center text-foreground font-medium">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          {row.dispatchDate}
        </div>
      ) 
    },
    { 
      header: 'Vehicle', 
      accessorKey: 'vehicle', 
      cell: (row: any) => (
        <div className="flex items-center text-muted-foreground">
          <Truck className="w-4 h-4 mr-2" />
          {row.vehicle}
        </div>
      ) 
    },
    { 
      header: 'Packing Progress', 
      accessorKey: 'progress', 
      cell: (row: any) => (
        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between text-xs">
            <span className="font-medium">{row.itemsPacked}/{row.totalItems} Items</span>
            <span className="text-muted-foreground">{Math.round((row.itemsPacked/row.totalItems)*100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${row.itemsPacked === row.totalItems ? 'bg-success' : 'bg-primary'}`} 
              style={{ width: `${(row.itemsPacked / row.totalItems) * 100}%` }}
            ></div>
          </div>
          <div className="mt-1">
            <StatusBadge status={row.status} />
          </div>
        </div>
      ) 
    },
    {
      header: 'Actions', 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end">
          <Button 
            variant={row.status === 'Dispatched' ? 'outline' : 'primary'} 
            size="sm"
            onClick={() => router.push(`/events/packing/${row.id}`)}
          >
            <ListChecks className="w-4 h-4 mr-1.5" />
            Checklist
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Warehouse Packing</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage inventory packing checklists and vehicle dispatch.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="To Pack Today"
          value={12}
          icon={Box}
          subtitle="Action Needed"
          colorTheme="primary"
        />
        <StatsCard
          title="Packing in Progress"
          value={4}
          icon={Clock}
          subtitle="Active"
          colorTheme="yellow"
        />
        <StatsCard
          title="Ready for Dispatch"
          value={2}
          icon={PackageCheck}
          subtitle="Excellent"
          colorTheme="success"
        />
        <StatsCard
          title="Dispatched Today"
          value={3}
          icon={Truck}
          subtitle="Completed"
          colorTheme="primary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search dispatch ID or event..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <Box className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Packing & Dispatch</h3>
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
                    placeholder="Search dispatch ID or event..." 
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
