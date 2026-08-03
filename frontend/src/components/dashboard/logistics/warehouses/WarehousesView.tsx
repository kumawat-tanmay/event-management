'use client';

import React, { useEffect } from 'react';
import useSWR from 'swr';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { warehouseService, Warehouse } from '@/lib/services/warehouse.services';
import { Button } from '@/components/common/Button';
import WarehouseList from './WarehouseList';
import WarehouseDetail from './WarehouseDetail';
import WarehouseForm from './WarehouseForm';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';

export default function WarehousesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const { data: warehouses, error, mutate, isLoading } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);
  const { hasPermission } = usePermissions();
  
  const selectedWarehouseId = (params.id as string) || null;
  const isFormOpen = pathname === '/logistics/warehouses/new' || pathname.endsWith('/edit');
  const isEditMode = pathname.endsWith('/edit');

  const selectedWarehouse = warehouses?.find(w => w._id === selectedWarehouseId) || null;
  const warehouseToEdit = isEditMode ? selectedWarehouse : null;

  // Auto-select default / first warehouse when data loads and we are on the base page
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId && pathname === '/logistics/warehouses') {
      const defaultWh = warehouses.find(w => w.isDefault) || warehouses[0];
      if (defaultWh) {
        router.replace(`/logistics/warehouses/${defaultWh._id}`);
      }
    }
  }, [warehouses, selectedWarehouseId, pathname, router]);

  const canCreate = hasPermission('warehouses.create');
  const canUpdate = hasPermission('warehouses.update');
  const canDelete = hasPermission('warehouses.delete');

  const handleCreateNew = () => {
    router.push('/logistics/warehouses/new');
  };

  const handleEdit = () => {
    if (selectedWarehouseId) {
      router.push(`/logistics/warehouses/${selectedWarehouseId}/edit`);
    }
  };

  const handleCloseForm = () => {
    router.push(selectedWarehouseId ? `/logistics/warehouses/${selectedWarehouseId}` : '/logistics/warehouses');
  };

  const handleFormSuccess = () => {
    mutate();
    handleCloseForm();
  };

  const handleSelectWarehouse = (id: string) => {
    router.push(`/logistics/warehouses/${id}`);
  };

  if (isLoading) return <div className="flex h-full items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-error p-4">{t('warehouse.failedLoad', 'Failed to load warehouses.')}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-120px)] p-4 md:p-6 overflow-hidden">
      {/* Left Sidebar: List of Warehouses */}
      <div className={`w-full md:w-1/3 lg:w-1/4 flex-col gap-4 bg-card rounded-xl border border-border shadow-sm p-4 overflow-y-auto shrink-0 ${selectedWarehouseId ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between sticky top-0 bg-card z-10 pb-2 border-b border-border">
          <h2 className="text-lg font-bold font-display">{t('sidebar.warehouses')}</h2>
          <ActionGuard permission="warehouses.create">
            <Button onClick={handleCreateNew} size="sm" variant="primary" className="gap-2 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" /> {t('warehouse.addGodown')}
            </Button>
          </ActionGuard>
        </div>
        
        <WarehouseList 
          warehouses={warehouses || []} 
          selectedId={selectedWarehouseId} 
          onSelect={handleSelectWarehouse} 
        />
      </div>

      {/* Right Canvas: Details */}
      <div className={`w-full md:w-2/3 lg:w-3/4 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-col h-full ${selectedWarehouseId ? 'flex' : 'hidden md:flex'}`}>
        <WarehouseDetail 
          warehouse={selectedWarehouse} 
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDeleteSuccess={() => {
            mutate();
            router.push('/logistics/warehouses');
          }}
          onUpdateSuccess={() => mutate()}
          onBack={() => router.push('/logistics/warehouses')}
        />
      </div>

      {/* Form Modal/Sidebar */}
      {isFormOpen && (
        <WarehouseForm 
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          initialData={warehouseToEdit}
        />
      )}
    </div>
  );
}

