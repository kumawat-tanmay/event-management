'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Package, Layers, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { DataTable } from '@/components/common/DataTable';

// Mock data for Category Detail
const CATEGORY_DATA = {
  id: '1',
  name: 'Tents & Structures',
  description: 'Large tents, marquees, and structural frames used for outdoor events, weddings, and exhibitions.',
  status: 'Active',
  createdAt: '12 Jan 2024',
  updatedAt: '05 May 2025',
  totalItems: 45,
  activeRentals: 12,
  items: [
    { id: 'ITM-001', name: 'German Tent 20x40', sku: 'TENT-GER-2040', quantity: 2, status: 'Active' },
    { id: 'ITM-002', name: 'Pagoda Tent 5x5', sku: 'TENT-PAG-0505', quantity: 15, status: 'Active' },
    { id: 'ITM-003', name: 'Dome Tent Large', sku: 'TENT-DOM-L', quantity: 5, status: 'Maintenance' },
    { id: 'ITM-004', name: 'Shamiana Standard', sku: 'TENT-SHM-STD', quantity: 23, status: 'Active' },
  ]
};

export function CategoryDetailView() {
  const router = useRouter();
  const params = useParams();
  
  // Use params.id to fetch real data later
  const data = CATEGORY_DATA;

  const itemColumns = [
    { header: 'Item ID', accessorKey: 'id', cell: (row: any) => <span className="font-semibold text-primary">{row.id}</span> },
    { header: 'Item Name', accessorKey: 'name', cell: (row: any) => <span className="font-medium">{row.name}</span> },
    { header: 'SKU', accessorKey: 'sku', cell: (row: any) => <span className="text-muted-foreground">{row.sku}</span> },
    { header: 'Total Qty', accessorKey: 'quantity', cell: (row: any) => <span className="font-medium">{row.quantity}</span> },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              {data.name}
              <StatusBadge status={data.status} className="mt-1" />
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-10 max-w-2xl">
            {data.description}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/inventory/categories/${data.id}/edit`)}
          >
            <Edit className="w-4 h-4 shrink-0" />
            <span className="truncate">Edit Category</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatsCard
          title="Total Items"
          value={data.totalItems}
          icon={Package}
          subtitle="In this category"
          colorTheme="primary"
        />
        <StatsCard
          title="Active Rentals"
          value={data.activeRentals}
          icon={Layers}
          subtitle="Currently out"
          colorTheme="blue"
        />
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Created On</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.createdAt}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Info className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Last Updated</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.updatedAt}</p>
        </div>
      </div>

      {/* Items List Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Items in {data.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all inventory items belonging to this category.</p>
        </div>
        
        <div className="flex-1 overflow-auto">
          <DataTable
            data={data.items}
            columns={itemColumns}
          />
        </div>
      </div>
    </div>
  );
}
