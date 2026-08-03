'use client';

import React, { useState } from 'react';
import { warehouseService, Warehouse, Zone, Rack } from '@/lib/services/warehouse.services';
import { Building2, ArrowLeft, Edit2, Layers, Package, Loader2, LayoutGrid, Plus, Trash2, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface LayoutDetailProps {
  id: string;
}

export default function LayoutDetail({ id }: LayoutDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Fetch Warehouse Layout
  const { data: warehouse, isLoading, error, mutate } = useSWR<Warehouse>(
    id ? ['warehouse', id] : null,
    () => warehouseService.getWarehouseById(id)
  );

  // Modal States
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  
  const [addingRackZoneIndex, setAddingRackZoneIndex] = useState<number | null>(null);
  const [editingRack, setEditingRack] = useState<{ zoneIndex: number; rackIndex: number } | null>(null);
  const [deleteZoneIndex, setDeleteZoneIndex] = useState<number | null>(null);
  const [deleteRackObj, setDeleteRackObj] = useState<{ zoneIndex: number; rackIndex: number } | null>(null);

  // Form Inputs
  const [zoneNameInput, setZoneNameInput] = useState('');
  const [zoneDescInput, setZoneDescInput] = useState('');

  const [rackNameInput, setRackNameInput] = useState('');
  const [rackCapacityInput, setRackCapacityInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // ----------------------------------------------------
  // Helper: Save Updated Layout Payload to Backend
  // ----------------------------------------------------
  const saveUpdatedZones = async (updatedZones: Zone[], successMsg: string) => {
    if (!warehouse) return;
    setIsSaving(true);
    try {
      await warehouseService.updateWarehouse(warehouse._id, {
        name: warehouse.name,
        code: warehouse.code,
        location: warehouse.location,
        zones: updatedZones
      });
      toast.success(successMsg);
      await mutate();
      closeAllModals();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update layout');
    } finally {
      setIsSaving(false);
    }
  };

  const closeAllModals = () => {
    setIsAddZoneModalOpen(false);
    setEditingZoneIndex(null);
    setAddingRackZoneIndex(null);
    setEditingRack(null);
    setDeleteZoneIndex(null);
    setDeleteRackObj(null);
    setZoneNameInput('');
    setZoneDescInput('');
    setRackNameInput('');
    setRackCapacityInput('');
  };

  // ----------------------------------------------------
  // Zone Handlers
  // ----------------------------------------------------
  const handleOpenAddZone = () => {
    setZoneNameInput('');
    setZoneDescInput('');
    setIsAddZoneModalOpen(true);
  };

  const handleOpenEditZone = (index: number) => {
    if (!warehouse?.zones?.[index]) return;
    const targetZone = warehouse.zones[index];
    setZoneNameInput(targetZone.name);
    setZoneDescInput(targetZone.description || '');
    setEditingZoneIndex(index);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneNameInput.trim()) {
      toast.error('Zone name is required');
      return;
    }
    if (!warehouse) return;

    const zonesCopy: Zone[] = JSON.parse(JSON.stringify(warehouse.zones || []));

    if (editingZoneIndex !== null) {
      // Edit existing zone
      zonesCopy[editingZoneIndex].name = zoneNameInput.trim();
      zonesCopy[editingZoneIndex].description = zoneDescInput.trim();
      await saveUpdatedZones(zonesCopy, 'Zone updated successfully');
    } else {
      // Add new zone
      zonesCopy.push({
        name: zoneNameInput.trim(),
        description: zoneDescInput.trim(),
        racks: []
      });
      await saveUpdatedZones(zonesCopy, 'New Zone added successfully');
    }
  };

  const handleDeleteZone = async (index: number) => {
    setDeleteZoneIndex(index);
  };

  const confirmDeleteZone = async () => {
    if (deleteZoneIndex === null) return;
    if (!warehouse?.zones?.[deleteZoneIndex]) return;

    const zonesCopy: Zone[] = JSON.parse(JSON.stringify(warehouse.zones || []));
    zonesCopy.splice(deleteZoneIndex, 1);
    await saveUpdatedZones(zonesCopy, 'Zone deleted successfully');
  };

  // ----------------------------------------------------
  // Rack Handlers
  // ----------------------------------------------------
  const handleOpenAddRack = (zoneIndex: number) => {
    setRackNameInput('');
    setRackCapacityInput('500');
    setAddingRackZoneIndex(zoneIndex);
  };

  const handleOpenEditRack = (zoneIndex: number, rackIndex: number) => {
    if (!warehouse?.zones?.[zoneIndex]?.racks?.[rackIndex]) return;
    const targetRack = warehouse.zones[zoneIndex].racks[rackIndex];
    setRackNameInput(targetRack.name);
    setRackCapacityInput(targetRack.capacity || '');
    setEditingRack({ zoneIndex, rackIndex });
  };

  const handleSaveRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rackNameInput.trim()) {
      toast.error('Rack name is required');
      return;
    }
    if (!warehouse) return;

    const zonesCopy: Zone[] = JSON.parse(JSON.stringify(warehouse.zones || []));

    if (editingRack) {
      // Edit Rack
      const { zoneIndex, rackIndex } = editingRack;
      zonesCopy[zoneIndex].racks[rackIndex] = {
        ...zonesCopy[zoneIndex].racks[rackIndex],
        name: rackNameInput.trim(),
        capacity: rackCapacityInput.trim() || 'N/A'
      };
      await saveUpdatedZones(zonesCopy, 'Rack updated successfully');
    } else if (addingRackZoneIndex !== null) {
      // Add Rack to zone
      zonesCopy[addingRackZoneIndex].racks.push({
        name: rackNameInput.trim(),
        capacity: rackCapacityInput.trim() || '500',
        description: ''
      });
      await saveUpdatedZones(zonesCopy, 'New Rack added successfully');
    }
  };

  const handleDeleteRack = async (zoneIndex: number, rackIndex: number) => {
    setDeleteRackObj({ zoneIndex, rackIndex });
  };

  const confirmDeleteRack = async () => {
    if (!deleteRackObj) return;
    const { zoneIndex, rackIndex } = deleteRackObj;
    if (!warehouse?.zones?.[zoneIndex]?.racks?.[rackIndex]) return;

    const zonesCopy: Zone[] = JSON.parse(JSON.stringify(warehouse.zones || []));
    zonesCopy[zoneIndex].racks.splice(rackIndex, 1);
    await saveUpdatedZones(zonesCopy, 'Rack deleted successfully');
  };

  // Render Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render Error state
  if (error || !warehouse) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 font-sans">
        <Building2 className="w-12 h-12 text-error mb-4 opacity-50" />
        <h3 className="text-base font-extrabold text-foreground">Failed to Load Warehouse Layout</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Please check your connection or return to the directory.
        </p>
        <Button onClick={() => router.push('/inventory/warehouse-layout')} className="mt-4" size="sm">
          Return to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 font-sans">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-all shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                {warehouse.code || 'NO-CODE'}
              </span>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {warehouse.location || 'No Location registered'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-0.5">
              {warehouse.name} Layout
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="flex items-center gap-1.5 h-10 px-4 font-bold text-xs"
            onClick={handleOpenAddZone}
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Add Zone</span>
          </Button>

          <Button
            variant="primary"
            className="flex items-center gap-2 h-10 px-4 shadow-sm font-bold text-xs"
            onClick={() => router.push(`/inventory/warehouse-layout/${id}/edit`)}
          >
            <Edit2 className="w-4 h-4" />
            <span>Full Layout Builder</span>
          </Button>
        </div>
      </div>

      {/* Warehouse Layout Representation Grid */}
      <div className="space-y-6">
        
        {/* Layout stats card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-border rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Zones</span>
            <span className="text-2xl font-black text-foreground">{warehouse.zones?.length || 0} Zones</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-border rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Storage Racks</span>
            <span className="text-2xl font-black text-foreground">
              {warehouse.zones?.reduce((acc, z) => acc + (z.racks?.length || 0), 0) || 0} Racks
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-border rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
            <span className="text-base font-extrabold text-foreground flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${warehouse.isActive ? 'bg-success' : 'bg-zinc-400'}`} />
              {warehouse.isActive ? 'Active Godown' : 'Disabled / Inactive'}
            </span>
          </div>
        </div>

        {/* Zones and Racks view canvas */}
        {!warehouse.zones || warehouse.zones.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">No storage layout has been configured yet.</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button size="sm" onClick={handleOpenAddZone} variant="outline" className="gap-1 font-bold">
                <Plus className="w-4 h-4 text-primary" /> Add First Zone
              </Button>
              <Button size="sm" onClick={() => router.push(`/inventory/warehouse-layout/${id}/edit`)}>
                Configure Storage Layout
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {warehouse.zones.map((zone, zIndex) => (
              <Card key={zone._id || zIndex} className="border border-border shadow-sm rounded-2xl overflow-hidden group/card hover:shadow-md transition-all">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-border rounded-t-2xl flex justify-between items-start gap-3">
                  <div className="min-w-0 pr-1 flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate flex items-center gap-2">
                      <span>{zone.name}</span>
                    </h4>
                    {zone.description && (
                      <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                        {zone.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {zone.racks?.length || 0} Racks
                    </span>

                    {/* Quick Add Rack button inside Zone Header */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddRack(zIndex)}
                      className="w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground rounded-full transition-all cursor-pointer shadow-sm"
                      title="Add Rack to this Zone"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Quick Edit Zone button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditZone(zIndex)}
                      className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit Zone Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Delete Zone button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteZone(zIndex)}
                      className="p-1 rounded text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex flex-col gap-2.5 bg-card rounded-b-2xl">
                  {zone.racks && zone.racks.length > 0 ? (
                    zone.racks.map((rack, rIndex) => (
                      <div 
                        key={rack._id || rIndex}
                        className="group/rack flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-zinc-50/40 dark:bg-zinc-900/20 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0 pr-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {rack.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rack.capacity && rack.capacity !== 'N/A' && (
                            <span className="text-[10px] font-bold text-foreground dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-border/50 px-2 py-0.5 rounded-md">
                              {rack.capacity} Capacity
                            </span>
                          )}

                          {/* Quick Edit Rack button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditRack(zIndex, rIndex)}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Edit Rack"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Quick Delete Rack button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRack(zIndex, rIndex)}
                            className="p-1 text-muted-foreground hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Delete Rack"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-center">
                      <Package className="w-6 h-6 mb-1 opacity-20" />
                      <span className="text-[10px] italic">No racks inside this zone.</span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddRack(zIndex)}
                        className="text-[11px] font-bold text-primary hover:underline mt-1.5 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add First Rack
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* ---------------------------------------------------- */}
      {/* Zone Add / Edit Modal */}
      {/* ---------------------------------------------------- */}
      {(isAddZoneModalOpen || editingZoneIndex !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {editingZoneIndex !== null ? 'Edit Zone Details' : 'Add New Storage Zone'}
              </h3>
              <button 
                type="button" 
                onClick={closeAllModals} 
                className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Zone Name *
                </label>
                <Input 
                  value={zoneNameInput}
                  onChange={(e) => setZoneNameInput(e.target.value)}
                  placeholder="e.g. Zone A, Main Crockery"
                  required
                  autoFocus
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Description (Optional)
                </label>
                <Input 
                  value={zoneDescInput}
                  onChange={(e) => setZoneDescInput(e.target.value)}
                  placeholder="e.g. Storage for tent pipes and tarpaulins"
                  className="text-xs h-10"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={closeAllModals} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="h-9 px-4 font-bold gap-1.5" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingZoneIndex !== null ? 'Save Changes' : 'Add Zone'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Rack Add / Edit Modal */}
      {/* ---------------------------------------------------- */}
      {(addingRackZoneIndex !== null || editingRack !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {editingRack !== null ? 'Edit Storage Rack' : 'Add New Storage Rack'}
              </h3>

              
              <button 
                type="button" 
                onClick={closeAllModals} 
                className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRack} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Rack Name *
                </label>
                <Input 
                  value={rackNameInput}
                  onChange={(e) => setRackNameInput(e.target.value)}
                  placeholder="e.g. Rack A-1, Shelf 3"
                  required
                  autoFocus
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Capacity (Units)
                </label>
                <Input 
                  value={rackCapacityInput}
                  onChange={(e) => setRackCapacityInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="text-xs h-10"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={closeAllModals} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="h-9 px-4 font-bold gap-1.5" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingRack !== null ? 'Save Changes' : 'Add Rack'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteZoneIndex !== null}
        title="Delete Zone"
        message={`Are you sure you want to delete Zone "${deleteZoneIndex !== null && warehouse?.zones?.[deleteZoneIndex] ? warehouse.zones[deleteZoneIndex].name : ''}"?`}
        onConfirm={confirmDeleteZone}
        onClose={() => setDeleteZoneIndex(null)}
        isDestructive={true}
      />
      
      <ConfirmModal
        isOpen={deleteRackObj !== null}
        title="Delete Rack"
        message={`Are you sure you want to delete rack "${deleteRackObj && warehouse?.zones?.[deleteRackObj.zoneIndex]?.racks?.[deleteRackObj.rackIndex] ? warehouse.zones[deleteRackObj.zoneIndex].racks[deleteRackObj.rackIndex].name : ''}"?`}
        onConfirm={confirmDeleteRack}
        onClose={() => setDeleteRackObj(null)}
        isDestructive={true}
      />
    </div>
  );
}
