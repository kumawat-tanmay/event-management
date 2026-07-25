'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Box, Eye, Edit, Tag, Layers, AlertCircle, Trash2, Search } from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { cn } from '@/utils/cn';

const DUMMY_ITEMS = [
  { id: '1', code: 'ITM-001', name: 'Premium Sofa Set', category: 'Furniture', available: 45, reserved: 15, damaged: 2, status: 'Available' },
  { id: '2', code: 'ITM-002', name: 'LED Par Light', category: 'Lighting', available: 120, reserved: 40, damaged: 5, status: 'Available' },
  { id: '3', code: 'ITM-003', name: 'Waterproof Tent (40x40)', category: 'Tents', available: 12, reserved: 8, damaged: 0, status: 'Low Stock Alert' },
];

export function ItemsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL ITEMS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const tabs = ['ALL ITEMS', 'FURNITURE', 'LIGHTING', 'TENTS'];

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setData(data.filter(item => item.id !== itemToDelete));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setData(DUMMY_ITEMS);
      setLoading(false);
    }, 500);
  }, []);

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL ITEMS' ? true : item.category.toUpperCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: 'Item Details',
      accessorKey: 'name',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Box className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-bold text-foreground">{row.name}</div>
            <div className="text-xs font-mono text-muted-foreground">{row.code}</div>
          </div>
        </div>
      )
    },
    { header: 'Category', accessorKey: 'category', cell: (row: any) => <span className="font-semibold text-muted-foreground">{row.category}</span> },
    {
      header: 'Available',
      accessorKey: 'available',
      cell: (row: any) => (
        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full text-sm font-bold">
          {row.available}
        </span>
      )
    },
    { header: 'Reserved', accessorKey: 'reserved', cell: (row: any) => <span className="font-bold text-blue-600">{row.reserved}</span> },
    { header: 'Damaged', accessorKey: 'damaged', cell: (row: any) => <span className="font-bold text-error">{row.damaged}</span> },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/inventory/items/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/inventory/items/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete Item"
            onClick={() => handleDeleteClick(row.id)}
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Inventory Items</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage your catalog, rental prices, and overall stock.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href="/inventory/items/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Item</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Items Catalog"
          value="485"
          icon={Layers}
          subtitle="+4.2%"
          colorTheme="primary"
        />
        <StatsCard
          title="Total Available Stock"
          value="12,458"
          icon={Box}
          subtitle="Stable"
          colorTheme="success"
        />
        <StatsCard
          title="Reserved / Locked"
          value="4,520"
          icon={Tag}
          subtitle="Active"
          colorTheme="blue"
        />
        <StatsCard
          title="Damaged / Missing"
          value="124"
          icon={AlertCircle}
          subtitle="Warning"
          colorTheme="error"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          searchPlaceholder="Search items by name or SKU..."
          itemsPerPage={10}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <Box className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Item Catalog</h3>
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
                    placeholder="Search items by name or SKU..."
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
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item? This action cannot be undone."
        confirmText="Delete Item"
      />
    </div>
  );
}
