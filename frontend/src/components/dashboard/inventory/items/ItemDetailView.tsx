'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Hash, MapPin, Package, Tag, Clock, ArrowRightLeft, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { StatsCard } from '@/components/common/StatsCard';

const ITEM_DATA = {
  id: 'ITM-2025-001',
  name: 'German Tent 20x40',
  sku: 'TENT-GER-2040',
  category: 'Tents & Structures',
  description: 'Premium quality German structure tent suitable for large outdoor events. Includes white opaque roof and transparent side walls.',
  status: 'Active',
  totalQuantity: 15,
  availableQuantity: 8,
  rentedQuantity: 5,
  maintenanceQuantity: 2,
  unitPrice: '₹ 2,500/day',
  location: 'Warehouse A - Sec 4',
  movements: [
    { id: '1', date: '22 May 2025', type: 'OUT', reference: 'BK-2025-1056', quantity: 2, user: 'Rahul' },
    { id: '2', date: '20 May 2025', type: 'IN', reference: 'RET-2025-110', quantity: 4, user: 'Amit' },
    { id: '3', date: '18 May 2025', type: 'OUT', reference: 'BK-2025-1042', quantity: 5, user: 'Rahul' },
    { id: '4', date: '15 May 2025', type: 'MAINTENANCE', reference: 'MN-102', quantity: 2, user: 'Suresh' },
  ]
};

export function ItemDetailView() {
  const router = useRouter();
  const params = useParams();
  const data = ITEM_DATA; // Use params.id later

  const movementColumns = [
    { header: 'Date', accessorKey: 'date', cell: (row: any) => <span className="text-muted-foreground">{row.date}</span> },
    { header: 'Type', accessorKey: 'type', cell: (row: any) => (
        <span className={`font-bold text-[11px] px-2 py-1 rounded border ${
          row.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          row.type === 'OUT' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
          'bg-orange-500/10 text-orange-500 border-orange-500/20'
        }`}>
          {row.type}
        </span>
      )
    },
    { header: 'Quantity', accessorKey: 'quantity', cell: (row: any) => <span className="font-semibold">{row.type === 'OUT' ? '-' : '+'}{row.quantity}</span> },
    { header: 'Reference', accessorKey: 'reference', cell: (row: any) => <span className="text-primary font-medium cursor-pointer hover:underline">{row.reference}</span> },
    { header: 'Handled By', accessorKey: 'user', cell: (row: any) => <span>{row.user}</span> },
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
          <div className="flex items-center gap-4 ml-10 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> {data.sku}</span>
            <span className="flex items-center gap-1.5 text-primary"><Tag className="w-4 h-4" /> {data.category}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Move Stock</span>
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            <Edit className="w-4 h-4 shrink-0" />
            <span className="truncate">Edit Item</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Image */}
        <div className="space-y-6">
          {/* Image Placeholder */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground shadow-sm aspect-video">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No image available</p>
          </div>

          {/* Details Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-3">Item Details</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.description}
            </p>
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                <span className="text-sm font-semibold">{data.location}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> Unit Price</span>
                <span className="text-sm font-semibold text-emerald-500">{data.unitPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Movement */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Stock Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total</span>
              <span className="text-3xl font-black text-foreground">{data.totalQuantity}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">Available</span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{data.availableQuantity}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-2">Rented Out</span>
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{data.rentedQuantity}</span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider mb-2">Repair</span>
              <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{data.maintenanceQuantity}</span>
            </div>
          </div>

          {/* Movement History */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Stock Movement
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              <DataTable
                data={data.movements}
                columns={movementColumns}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
