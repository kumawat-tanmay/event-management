// View Component for Warehouse Details
import React, { useState } from 'react';
import { Warehouse, Zone, Rack, WarehouseInput } from '@/lib/services/warehouse.services';
import { Building2, MapPin, User as UserIcon, Trash2, Edit2, Package, Layers, Plus, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Input } from '@/components/common/Input';
import { warehouseService } from '@/lib/services/warehouse.services';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface WarehouseDetailProps {
  warehouse: Warehouse | null;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDeleteSuccess: () => void;
  onUpdateSuccess?: () => void;
  onBack?: () => void;
}

export default function WarehouseDetail({ warehouse, canUpdate, canDelete, onEdit, onDeleteSuccess, onUpdateSuccess, onBack }: WarehouseDetailProps) {
  const { t, i18n } = useTranslation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!warehouse) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
        <Building2 className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('warehouse.noGodowns', 'No Warehouse Selected')}</h3>
        <p className="max-w-sm text-sm">{t('warehouse.noGodownsSub', 'Select a warehouse from the sidebar to view its layout and details.')}</p>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await warehouseService.deleteWarehouse(warehouse._id);
      toast.success(t('warehouse.deleteSuccess', 'Warehouse deleted successfully'));
      onDeleteSuccess();
    } catch (error: any) {
      toast.error(error.message || t('warehouse.deleteFail', 'Failed to delete warehouse'));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleInlineUpdate = async (updatedWarehouse: Warehouse) => {
    try {
      const payload: Partial<WarehouseInput> = {
        name: updatedWarehouse.name,
        location: updatedWarehouse.location,
        isActive: updatedWarehouse.isActive,
        zones: updatedWarehouse.zones,
        managerId: updatedWarehouse.managerId ? updatedWarehouse.managerId._id : undefined,
      };
      
      await warehouseService.updateWarehouse(warehouse._id, payload);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error: any) {
      toast.error(error.message || t('warehouse.updateFail', 'Failed to update layout'));
      throw error;
    }
  };

  const dateLocale = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
        <div className="space-y-1.5 md:space-y-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200/50 hover:bg-zinc-200 text-muted-foreground transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <h3 className="text-xl md:text-2xl font-bold font-display text-foreground truncate">{warehouse.name}</h3>
            {!warehouse.isActive && (
              <span className="text-[10px] md:text-xs uppercase font-bold bg-error/10 text-error px-2 py-0.5 md:py-1 rounded shrink-0">{t('warehouse.inactive', 'Disabled')}</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-xs md:text-sm text-muted-foreground ml-11 md:ml-0">
            {warehouse.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{warehouse.location}</span>
              </div>
            )}
            {warehouse.managerId && (
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                <span>{t('warehouse.manager', 'Manager')}: <span className="font-medium text-foreground">{warehouse.managerId.name}</span></span>
              </div>
            )}
            {warehouse.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{t('warehouse.created', 'Created')}: <span className="font-medium text-foreground">{new Date(warehouse.createdAt).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
          {canUpdate && (
            <Button onClick={onEdit} variant="outline" className="h-9 px-3 gap-1.5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40">
              <Plus className="w-3.5 h-3.5" /> {t('warehouse.addZone')}
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="text-error border-error/20 hover:bg-error/10 h-9 px-3">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {canUpdate && (
            <Button onClick={onEdit} variant="primary" className="h-9 px-4 gap-2">
              <Edit2 className="w-3.5 h-3.5" /> {t('warehouse.editWarehouse')}
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/30 dark:bg-zinc-900/20">
        <h4 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> {t('warehouse.layoutLabel', 'Warehouse Layout')}
        </h4>
        
        {warehouse.zones && warehouse.zones.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {warehouse.zones.map((zone, zIndex) => (
              <ZoneCard 
                key={zone._id || zone.name} 
                warehouse={warehouse} 
                zoneIndex={zIndex} 
                canUpdate={canUpdate} 
                onInlineUpdate={handleInlineUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('warehouse.noZones', 'No zones configured for this warehouse.')}</p>
            {canUpdate && (
              <Button variant="ghost" onClick={onEdit} className="text-primary mt-2 hover:bg-transparent hover:underline">
                {t('warehouse.addZonesRacks', 'Add Zones & Racks')}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('warehouse.deleteWarehouse')}
        message={t('warehouse.deleteConfirmMsg')}
        confirmText={t('warehouse.deleteWarehouse')}
      />
    </div>
  );
}

// Internal Composed Components
function ZoneCard({ 
  warehouse, 
  zoneIndex, 
  canUpdate, 
  onInlineUpdate 
}: { 
  warehouse: Warehouse, 
  zoneIndex: number, 
  canUpdate: boolean,
  onInlineUpdate: (w: Warehouse) => Promise<void>
}) {
  const { t } = useTranslation();
  const zone = warehouse.zones[zoneIndex];
  const [isSaving, setIsSaving] = useState(false);
  const handleAddRack = async () => {
    setIsSaving(true);
    try {
      const updatedWarehouse = JSON.parse(JSON.stringify(warehouse));
      const newRackName = `Rack ${updatedWarehouse.zones[zoneIndex].racks.length + 1}`;
      updatedWarehouse.zones[zoneIndex].racks.push({
        name: newRackName,
        capacity: 'N/A'
      });
      
      await onInlineUpdate(updatedWarehouse);
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="px-4 py-3 bg-zinc-100/80 dark:bg-zinc-800/80 border-b border-border flex justify-between items-start rounded-t-xl">
        <div className="pr-2">
          <h5 className="font-bold text-sm text-foreground">{zone.name}</h5>
          {zone.description && <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-tight">{zone.description}</p>}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold bg-zinc-200/80 dark:bg-zinc-700 text-muted-foreground px-2 py-0.5 rounded-full">
            {t('roles.count', { count: zone.racks?.length || 0, defaultValue: '{{count}} Racks' }).replace('Racks', t('warehouse.racks', 'Racks'))}
          </span>
          {canUpdate && (
            <button 
              onClick={handleAddRack}
              disabled={isSaving}
              className="w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
              title={t('warehouse.addRack')}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {zone.racks && zone.racks.length > 0 ? (
          zone.racks.map((rack, rIndex) => (
            <RackItem 
              key={rack._id || rIndex} 
              warehouse={warehouse}
              zoneIndex={zoneIndex}
              rackIndex={rIndex}
              canUpdate={canUpdate}
              onInlineUpdate={onInlineUpdate}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <Layers className="w-5 h-5 mb-1.5 opacity-20" />
            <span className="text-[11px] italic">{t('warehouse.noRacks', 'No racks in this zone')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RackItem({ 
  warehouse,
  zoneIndex,
  rackIndex,
  canUpdate,
  onInlineUpdate
}: { 
  warehouse: Warehouse, 
  zoneIndex: number, 
  rackIndex: number,
  canUpdate: boolean,
  onInlineUpdate: (w: Warehouse) => Promise<void> 
}) {
  const { t } = useTranslation();
  const rack = warehouse.zones[zoneIndex].racks[rackIndex];
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(rack.name);
  const [editCapacity, setEditCapacity] = useState(rack.capacity || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const updatedWarehouse = JSON.parse(JSON.stringify(warehouse));
      updatedWarehouse.zones[zoneIndex].racks.splice(rackIndex, 1);
      await onInlineUpdate(updatedWarehouse);
      toast.success(t('warehouse.rackDeleted', 'Rack deleted'));
    } catch (error) {
      setIsDeleting(false);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    setIsSaving(true);
    try {
      const updatedWarehouse = JSON.parse(JSON.stringify(warehouse));
      updatedWarehouse.zones[zoneIndex].racks[rackIndex] = {
        ...updatedWarehouse.zones[zoneIndex].racks[rackIndex],
        name: editName.trim(),
        capacity: editCapacity.trim() || 'N/A'
      };
      
      await onInlineUpdate(updatedWarehouse);
      setIsEditing(false);
      toast.success(t('warehouse.rackUpdated', 'Rack updated'));
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex flex-col gap-2 p-2.5 rounded-lg border border-primary/30 bg-card shadow-sm">
        <div className="flex gap-2">
          <Input 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('warehouse.rackName')}
            className="h-8 text-xs px-2"
            autoFocus
            required
          />
          <Input 
            value={editCapacity}
            onChange={(e) => setEditCapacity(e.target.value)}
            placeholder={t('warehouse.capacity')}
            className="h-8 text-xs px-2 w-20"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setIsEditing(false)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
          <button type="submit" disabled={isSaving} className="p-1 text-primary hover:text-primary/80">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0"></div>
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{rack.name}</span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {rack.capacity && rack.capacity !== 'N/A' && (
          <span className="text-[10px] font-bold tracking-wide text-muted-foreground bg-zinc-200/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded shadow-sm border border-border/40">
            {rack.capacity}
          </span>
        )}
        
        {/* Actions - Always visible */}
        {canUpdate && (
          <div className="flex items-center gap-1 ml-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-primary hover:bg-primary/10 transition-colors rounded-md"
              title={t('warehouse.editRack', 'Edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting}
              className="p-1.5 text-error hover:bg-error/10 transition-colors rounded-md"
              title={t('warehouse.deleteRack', 'Delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('warehouse.deleteConfirm')}
        message={t('warehouse.deleteConfirmMsg')}
        confirmText={t('warehouse.deleteConfirm')}
      />
    </div>
  );
}
