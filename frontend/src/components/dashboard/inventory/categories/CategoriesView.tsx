'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Download, Tag, Search, Filter, Eye, Edit, Layers, Trash2, CheckCircle, Package } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const DUMMY_CATEGORIES = [
  { id: '1', name: 'Tents & Structures', description: 'Large tents, marquees, and structural frames', itemsCount: 45, status: 'Active' },
  { id: '2', name: 'Furniture', description: 'Chairs, tables, sofas, and seating arrangements', itemsCount: 120, status: 'Active' },
  { id: '3', name: 'Lighting', description: 'Fairy lights, chandeliers, focus lights', itemsCount: 85, status: 'Active' },
  { id: '4', name: 'Decor & Props', description: 'Vases, centerpieces, carpets, and stage props', itemsCount: 200, status: 'Active' },
  { id: '5', name: 'Audio/Video', description: 'Speakers, mics, screens, and DJ equipment', itemsCount: 30, status: 'Inactive' },
];

export function CategoriesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(DUMMY_CATEGORIES);
  const [activeTab, setActiveTab] = useState('ALL CATEGORIES');
  const tabs = ['ALL CATEGORIES', 'ACTIVE', 'INACTIVE'];
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const filteredData = data.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cat.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL CATEGORIES' || 
                       (activeTab === 'ACTIVE' && cat.status === 'Active') || 
                       (activeTab === 'INACTIVE' && cat.status === 'Inactive');
    return matchesSearch && matchesTab;
  });

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      setData(data.filter(item => item.id !== categoryToDelete));
      setCategoryToDelete(null);
    }
  };

  const columns = [
    { header: 'Category Name', accessorKey: 'name', cell: (row: any) => <span className="font-semibold text-primary">{row.name}</span> },
    { header: 'Description', accessorKey: 'description', cell: (row: any) => <span className="text-muted-foreground truncate max-w-[300px] block">{row.description}</span> },
    { header: 'Total Items', accessorKey: 'itemsCount', cell: (row: any) => <span className="font-medium">{row.itemsCount}</span> },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} /> },
    { 
      header: 'Actions', 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/inventory/categories/${row.id}`}>
            <Button variant="outline" className="h-8 w-8 p-0" title="View Details">
              <Eye className="w-4 h-4 text-blue-500" />
            </Button>
          </Link>
          <Link href={`/inventory/categories/${row.id}/edit`}>
            <Button variant="outline" className="h-8 w-8 p-0" title="Edit Category">
              <Edit className="w-4 h-4 text-yellow-500" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500/30" 
            title="Delete Category"
            onClick={() => handleDeleteClick(row.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Inventory Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage item classifications and groups</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/inventory/categories/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Add Category</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <StatsCard
          title="Total Categories"
          value={data.length}
          icon={Layers}
          subtitle="+1 New"
          colorTheme="primary"
        />
        <StatsCard
          title="Active Categories"
          value={data.filter(d => d.status === 'Active').length}
          icon={CheckCircle}
          subtitle="All Good"
          colorTheme="success"
        />
        <StatsCard
          title="Total Items Linked"
          value={data.reduce((acc, curr) => acc + curr.itemsCount, 0)}
          icon={Package}
          subtitle="Overall Stock"
          colorTheme="blue"
        />
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <DataTable
          data={filteredData}
          columns={columns}
          headerContent={
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-2">
              <div className="flex items-center gap-2 w-full lg:w-1/3">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Category List</h3>
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
                    placeholder="Search categories..." 
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone and may affect items linked to this category."
        confirmText="Delete Category"
      />
    </div>
  );
}
