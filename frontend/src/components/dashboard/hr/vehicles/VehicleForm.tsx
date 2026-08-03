'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { hrService, Vehicle, VehicleInput, Staff } from '@/lib/services/hr.services';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { getVehicleSchema } from '@/utils/validations';

interface VehicleFormProps {
  isEdit?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  initialData?: Vehicle | null;
}

export function VehicleForm({ isEdit = false, isOpen, onClose, onSuccess, initialData }: VehicleFormProps) {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Staff list for Driver assignment dropdown
  const { data: staffList = [] } = useSWR<Staff[]>(isOpen !== false ? 'hr-staff-drivers' : null, hrService.getStaff);
  const driversOnly = staffList.filter(s => s.status === 'Active');

  const [formData, setFormData] = useState<VehicleInput>({
    name: '',
    plateNumber: '',
    type: 'Pickup 407',
    capacity: '1.5 Tons',
    assignedDriverId: null,
    status: 'available',
    ownership: 'company'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        plateNumber: initialData.plateNumber || '',
        type: initialData.type || 'Pickup 407',
        capacity: initialData.capacity || '1.5 Tons',
        assignedDriverId: initialData.assignedDriverId ? (typeof initialData.assignedDriverId === 'object' ? (initialData.assignedDriverId as any)._id : initialData.assignedDriverId) : null,
        status: initialData.status || 'available',
        ownership: initialData.ownership || 'company'
      });
    } else if (isEdit && vehicleId) {
      setLoading(true);
      hrService.getVehicleById(vehicleId)
        .then((data) => {
          if (data) {
            setFormData({
              name: data.name || '',
              plateNumber: data.plateNumber || '',
              type: data.type || 'Pickup 407',
              capacity: data.capacity || '1.5 Tons',
              assignedDriverId: data.assignedDriverId ? (typeof data.assignedDriverId === 'object' ? (data.assignedDriverId as any)._id : data.assignedDriverId) : null,
              status: data.status || 'available',
              ownership: data.ownership || 'company'
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching vehicle details:', err);
          setErrorMsg('Failed to load vehicle details');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, vehicleId, initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedDriverId' ? (value || null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod validation check
    const validationResult = getVehicleSchema(t).safeParse(formData);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid input';
      setErrorMsg(firstIssue);
      toast.error(firstIssue);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const targetId = initialData?._id || (isEdit ? vehicleId : null);
      if (targetId) {
        await hrService.updateVehicle(targetId, validationResult.data as any);
        toast.success('Vehicle record updated successfully');
      } else {
        await hrService.createVehicle(validationResult.data as any);
        toast.success('Vehicle registered successfully');
      }
      
      if (onSuccess) onSuccess();
      if (onClose) {
        onClose();
      } else {
        router.push('/hr/vehicles');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save vehicle record';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Form Fields Component
  const FormFields = (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      
      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 text-error border border-error/20 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Vehicle Model / Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Bolero Camper HD"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">Plate / License Reg Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="plateNumber"
            value={formData.plateNumber}
            onChange={handleChange}
            placeholder="e.g. RJ-14-GA-8821"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none uppercase font-mono font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.vehicleCategory')} <span className="text-red-500">*</span></label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Pickup 407">Pickup 407</option>
            <option value="Tata Ace">Tata Ace (Chhota Hathi)</option>
            <option value="Heavy Truck">Heavy Truck (Eicher 14Ft+)</option>
            <option value="Bolero">Bolero Camper</option>
            <option value="Van">Delivery Van</option>
            <option value="Tractor">Tractor</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.payloadCapacity')}</label>
          <input
            type="text"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="e.g. 2.5 Tons / 400 Cu.ft"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.assignedDriver')}</label>
          <select
            name="assignedDriverId"
            value={formData.assignedDriverId || ''}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">-- No Driver Assigned --</option>
            {driversOnly.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.name} ({driver.role}) - {driver.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.currentStatus')}</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="available">Available (Ready for Dispatch)</option>
            <option value="on_dispatch">On Dispatch (On Site)</option>
            <option value="maintenance">Maintenance / Repair</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.ownership')}</label>
          <select
            name="ownership"
            value={formData.ownership}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="company">Company Owned (In-House)</option>
            <option value="rented">Rented / Vendor Vehicle</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose ? onClose : () => router.back()} 
          disabled={submitting}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="gap-2 font-bold px-6">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{initialData || isEdit ? t('common.save', 'Save Changes') : t('hr.registerVehicle')}</span>
        </Button>
      </div>

    </form>
  );

  // Modal Mode (If isOpen prop is passed)
  if (isOpen !== undefined) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title={initialData ? t('hr.editVehicle') : t('hr.registerVehicle')}
        size="lg"
      >
        {FormFields}
      </Modal>
    );
  }

  // Full-Page Mode
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={isEdit ? t('hr.editVehicle') : t('hr.registerVehicle')}
            description={isEdit ? 'Update transport vehicle registration, driver assignment, and availability status.' : 'Register a pickup, truck, or van into company transport fleet.'}
          />
        </div>
      </div>

      {/* Main Card Form */}
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>{isEdit ? 'Update Vehicle Registration' : 'Fleet Vehicle Registration Information'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {FormFields}
        </CardContent>
      </Card>

    </div>
  );
}
