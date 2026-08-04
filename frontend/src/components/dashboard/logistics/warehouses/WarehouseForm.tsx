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
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch managers for dropdown
  const { data: users } = useSWR<User[]>('users', userService.getUsers);
  const activeManagers = users?.filter(u => u.isActive) || [];

  // ponytail: Keep WarehouseForm strictly focused on Warehouse master details.
  // Layout Builder (zones/racks) is handled exclusively in /inventory/warehouse-layout.
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setManagerId(typeof initialData.managerId === 'object' ? initialData.managerId?._id : (initialData.managerId || ''));
      setIsActive(initialData.isActive);
      setIsDefault(initialData.isDefault || false);
    } else {
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
      setManagerId('');
      setIsActive(true);
      setIsDefault(false);
    }
  }, [initialData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod v4 validation check
    const validationResult = getWarehouseSchema(t).safeParse({
      name: name.trim(),
      code: name.trim().length >= 2 ? name.trim().slice(0, 4).toUpperCase() : 'WH-01',
      address: address.trim(),
      phone: '',
      isDefault: false,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid warehouse input';
      return toast.error(firstIssue);
    }

    setIsSaving(true);
    try {
      const payload: WarehouseInput = {
        name: validationResult.data.name,
        code: code || undefined,
        address,
        phone,
        managerId: managerId || null,
        isActive,
        isDefault,
        // Preserve existing zones on edit so layout data is preserved
        zones: initialData?.zones || []
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
      <div className="relative bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold font-display">{initialData ? t('warehouse.editWarehouse') : t('warehouse.addGodown')}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="warehouse-form" onSubmit={handleSave} className="space-y-6">

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
                  <label className="text-sm font-medium text-foreground">{t('warehouse.address', 'Full Address')}</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('warehouse.addressPlace', 'Complete address')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('warehouse.phone', 'Phone Number')}</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('warehouse.phonePlace', '+91 9876543210')} />
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
