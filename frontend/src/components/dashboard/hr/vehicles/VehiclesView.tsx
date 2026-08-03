'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Car, Eye, Edit, Trash2, Search, MessageSquare, RefreshCw, Truck, CheckCircle2, Wrench } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { hrService, Vehicle } from '@/lib/services/hr.services';
import toast from 'react-hot-toast';

export function VehiclesView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const statusTabs = ['ALL', 'AVAILABLE', 'ON DISPATCH', 'MAINTENANCE'];

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const fleetList = await hrService.getVehicles();
      setData(fleetList || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const confirmDelete = async () => {
    if (vehicleToDelete) {
      try {
        await hrService.deleteVehicle(vehicleToDelete);
        toast.success('Vehicle record deleted');
        setData(data.filter(v => v._id !== vehicleToDelete));
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete vehicle record');
      } finally {
        setDeleteModalOpen(false);
        setVehicleToDelete(null);
      }
    }
  };

  const filteredData = data.filter(v => {
    const matchesSearch = (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.vehicleId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab !== 'ALL') {
      const normalizedStatus = activeTab.toLowerCase().replace(' ', '_');
      matchesTab = v.status === normalizedStatus;
    }
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      header: t('hr.vehicleModelReg'), accessorKey: 'name', cell: (row: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <Link href={`/hr/vehicles/${row._id}`} className="font-bold text-foreground text-sm hover:text-primary transition-colors flex items-center gap-1.5">
              {row.name}
              <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.2 rounded">
                {row.vehicleId}
              </span>
            </Link>
            <span className="text-xs font-mono font-semibold text-muted-foreground">{row.plateNumber}</span>
          </div>
        </div>
      )
    },
    {
      header: t('hr.categoryCapacity'), accessorKey: 'type', cell: (row: Vehicle) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-foreground">{row.type}</span>
          <span className="text-[10px] text-muted-foreground">{row.capacity}</span>
        </div>
      )
    },
    {
      header: t('hr.assignedDriver'), accessorKey: 'assignedDriverId', cell: (row: Vehicle) => {
        const driver = row.assignedDriverId;
        if (!driver) return <span className="text-xs text-muted-foreground italic">{t('hr.unassigned')}</span>;
        return (
          <span className="font-semibold text-xs text-foreground">{driver.name}</span>
        );
      }
    },
    {
      header: t('hr.status'), accessorKey: 'status', cell: (row: Vehicle) => (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
          row.status === 'available' ? 'bg-emerald-500/10 text-emerald-600' :
          row.status === 'on_dispatch' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {row.status.replace('_', ' ')}
        </span>
      )
    },
    {
      header: t('hr.ownership'), accessorKey: 'ownership', cell: (row: Vehicle) => (
        <span className="font-semibold text-xs text-muted-foreground capitalize">
          {row.ownership}
        </span>
      )
    },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: Vehicle) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Driver WhatsApp Chat Action */}
          {row.assignedDriverId && (
            <a href={`https://wa.me/${row.assignedDriverId.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" title="WhatsApp Driver">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </a>
          )}

          {/* View Details Link */}
          <Link href={`/hr/vehicles/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="View Vehicle Details">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          {/* Edit Link */}
          <ActionGuard permission="hr.update">
            <Link href={`/hr/vehicles/${row._id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit Vehicle Record">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>

          {/* Delete */}
          <ActionGuard permission="hr.delete">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setVehicleToDelete(row._id);
                setDeleteModalOpen(true);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
              title="Delete Vehicle Record"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('hr.vehiclesTitle')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('hr.vehiclesSub')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchVehicles} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Refresh')}</span>
          </Button>
          <ActionGuard permission="hr.create">
            <Link href="/hr/vehicles/new" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2 font-bold">
                <Plus className="w-4 h-4 shrink-0" />
                <span>{t('hr.registerVehicle')}</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title={t('hr.totalVehicles')}
          value={data.length}
          icon={Truck}
          colorTheme="primary"
        />
        <StatsCard
          title={t('hr.availableReady')}
          value={data.filter(v => v.status === 'available').length}
          icon={CheckCircle2}
          colorTheme="success"
        />
        <StatsCard
          title={t('hr.onDispatch')}
          value={data.filter(v => v.status === 'on_dispatch').length}
          icon={Truck}
          colorTheme="secondary"
        />
        <StatsCard
          title={t('hr.inMaintenance')}
          value={data.filter(v => v.status === 'maintenance').length}
          icon={Wrench}
          colorTheme="warning"
        />
      </div>

      {/* Main Table Card */}
      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Truck className="w-5 h-5 text-primary" />
            <span>{t('hr.fleetDirectory')} ({filteredData.length})</span>
          </div>
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {statusTabs.map((tab) => (
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicle, plate..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('hr.deleteVehicleTitle')}
        message={t('hr.deleteVehicleMsg')}
      />

    </div>
  );
}
