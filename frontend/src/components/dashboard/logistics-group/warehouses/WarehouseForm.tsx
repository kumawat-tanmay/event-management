import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Warehouse, WarehouseInput, Zone, Rack, warehouseService } from '@/lib/services/warehouse.services';
import { userService, User } from '@/lib/services/user.services';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { getWarehouseSchema } from '@/utils/validations';
import { useTranslation } from 'react-i18next';

interface WarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: Warehouse | null;
}

export default function WarehouseForm({ isOpen, onClose, onSuccess, initialData }: WarehouseFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch managers for dropdown
  const { data: users } = useSWR<User[]>('users', userService.getUsers);
  const activeManagers = users?.filter(u => u.isActive) || [];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code || '');
      setLocation(initialData.location || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setCapacity(initialData.capacity?.toString() || '');
      setManagerId(initialData.managerId?._id || '');
      setIsActive(initialData.isActive);
      setIsDefault(initialData.isDefault || false);
      // Deep clone zones to avoid mutating original state before save
      setZones(JSON.parse(JSON.stringify(initialData.zones || [])));
    } else {
      setName('');
      setCode('');
      setLocation('');
      setAddress('');
      setPhone('');
      setCapacity('');
      setManagerId('');
      setIsActive(true);
      setIsDefault(false);
      setZones([]);
    }
  }, [initialData]);

  const handleAddZone = () => {
    setZones([...zones, { name: '', description: '', racks: [] }]);
  };

  const handleRemoveZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const handleUpdateZone = (index: number, field: keyof Zone, value: string) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], [field]: value };
    setZones(newZones);
  };

  const handleAddRack = (zoneIndex: number) => {
    const newZones = [...zones];
    newZones[zoneIndex].racks.push({ name: '', capacity: '' });
    setZones(newZones);
  };

  const handleRemoveRack = (zoneIndex: number, rackIndex: number) => {
    const newZones = [...zones];
    newZones[zoneIndex].racks = newZones[zoneIndex].racks.filter((_, i) => i !== rackIndex);
    setZones(newZones);
  };

  const handleUpdateRack = (zoneIndex: number, rackIndex: number, field: keyof Rack, value: string) => {
    const newZones = [...zones];
    newZones[zoneIndex].racks[rackIndex] = { ...newZones[zoneIndex].racks[rackIndex], [field]: value };
    setZones(newZones);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod v4 validation check
    const validationResult = getWarehouseSchema(t).safeParse({
      name: name.trim(),
      code: name.trim().length >= 2 ? name.trim().slice(0, 4).toUpperCase() : 'WH-01',
      address: location.trim(),
      phone: '',
      capacity: 5000,
      isDefault: false,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid warehouse input';
      return toast.error(firstIssue);
    }

    // Basic validation for zones and racks
    for (const zone of zones) {
      if (!zone.name.trim()) return toast.error(t('warehouse.zoneNameError', 'All zones must have a name'));
      for (const rack of zone.racks) {
        if (!rack.name.trim()) return toast.error(t('warehouse.rackNameError', 'All racks must have a name'));
      }
    }

    setIsSaving(true);
    try {
      const payload: WarehouseInput = {
        name: validationResult.data.name,
        code: code || undefined,
        location,
        address,
        phone,
        capacity: capacity ? Number(capacity) : undefined,
        managerId: managerId || null,
        isActive,
        isDefault,
        zones
      };

      if (initialData) {
        await warehouseService.updateWarehouse(initialData._id, payload);
        toast.success(t('warehouse.updateSuccess', 'Warehouse updated successfully'));
      } else {
        await warehouseService.createWarehouse(payload);
        toast.success(t('warehouse.createSuccess', 'Warehouse created successfully'));
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('warehouse.saveFail', 'Failed to save warehouse'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold font-display">{initialData ? t('warehouse.editWarehouse') : t('warehouse.addGodown')}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="warehouse-form" onSubmit={handleSave} className="space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('roles.type', 'Basic Information')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.name')} <span className="text-error">*</span></label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('warehouse.namePlace', 'e.g. Main Godown')} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.code', 'Warehouse Code')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional', 'Optional')})</span></label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('common.codePlace', 'Auto-generates if left blank')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.location')}</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('warehouse.locationPlace', 'e.g. Plot 45, Industrial Area')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.address', 'Full Address')}</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('warehouse.addressPlace', 'Complete address')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.phone', 'Phone Number')}</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('warehouse.phonePlace', '+91 9876543210')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.capacity', 'Total Capacity')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional', 'Optional')})</span></label>
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder={t('warehouse.capacityPlace', 'e.g. 5000 units')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.manager')}</label>
                  <select 
                    value={managerId} 
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">{t('warehouse.selectManager')}</option>
                    {activeManagers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{t('warehouse.activeStatus', 'Active Warehouse')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isDefault} 
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{t('warehouse.isDefault', 'Set as Default')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('warehouse.layoutLabel', 'Warehouse Layout')}</h4>
                <Button type="button" onClick={handleAddZone} variant="outline" size="sm" className="h-8 gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> {t('warehouse.addZone')}
                </Button>
              </div>

              {zones.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                  <p className="text-sm text-muted-foreground">{t('warehouse.noZonesAdded', 'No zones added yet.')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {zones.map((zone, zIndex) => (
                    <div key={zIndex} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
                      
                      {/* Zone Header */}
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                            value={zone.name} 
                            onChange={(e) => handleUpdateZone(zIndex, 'name', e.target.value)}
                            placeholder={t('warehouse.zoneName')} 
                            required
                          />
                          <Input 
                            value={zone.description || ''} 
                            onChange={(e) => handleUpdateZone(zIndex, 'description', e.target.value)}
                            placeholder={t('roles.descriptionPlace', 'Description (Optional)')} 
                          />
                        </div>
                        <Button type="button" onClick={() => handleRemoveZone(zIndex)} variant="outline" className="text-error border-error/20 hover:bg-error/10 px-3">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Racks */}
                      <div className="pl-4 border-l-2 border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                            {t('warehouse.racksIn', 'Racks in {{name}}', { name: zone.name || '' })}
                          </h5>
                          <Button type="button" onClick={() => handleAddRack(zIndex)} variant="ghost" size="sm" className="h-6 text-xs gap-1 text-primary">
                            <Plus className="w-3 h-3" /> {t('warehouse.addRack')}
                          </Button>
                        </div>
                        
                        {zone.racks.map((rack, rIndex) => (
                          <div key={rIndex} className="flex gap-3 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <Input 
                              value={rack.name} 
                              onChange={(e) => handleUpdateRack(zIndex, rIndex, 'name', e.target.value)}
                              placeholder={t('warehouse.rackName')} 
                              className="h-8 text-sm"
                              required
                            />
                            <Input 
                              value={rack.capacity || ''} 
                              onChange={(e) => handleUpdateRack(zIndex, rIndex, 'capacity', e.target.value)}
                              placeholder={t('warehouse.rackCapacityPlace', 'Capacity (e.g. 50 units)')} 
                              className="h-8 text-sm w-32"
                            />
                            <button type="button" onClick={() => handleRemoveRack(zIndex, rIndex)} className="text-muted-foreground hover:text-error transition-colors p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('warehouse.cancel')}
          </Button>
          <Button type="submit" form="warehouse-form" variant="primary" disabled={isSaving} className="min-w-[100px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('warehouse.saveWarehouse')}
          </Button>
        </div>
      </div>
    </div>
  );
}
