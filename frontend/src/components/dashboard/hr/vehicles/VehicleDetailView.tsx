'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Edit, Trash2, Car, User, 
  MessageSquare, Loader2, Truck, CheckCircle2, Wrench, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { hrService, Vehicle } from '@/lib/services/hr.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import toast from 'react-hot-toast';

export function VehicleDetailView() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchVehicleData = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const data = await hrService.getVehicleById(vehicleId);
      setVehicle(data);
    } catch (err) {
      console.error('Error loading vehicle details:', err);
      toast.error('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId]);

  const handleDelete = async () => {
    if (vehicleId) {
      try {
        await hrService.deleteVehicle(vehicleId);
        toast.success('Vehicle record deleted');
        router.push('/hr/vehicles');
      } catch (err) {
        console.error('Error deleting vehicle record:', err);
        toast.error('Failed to delete vehicle record');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-center space-y-4 font-sans">
        <h3 className="text-xl font-bold text-foreground">{t('hr.vehicleNotFound')}</h3>
        <Button variant="outline" onClick={() => router.push('/hr/vehicles')}>
          {t('hr.backToFleet')}
        </Button>
      </div>
    );
  }

  const driver = vehicle.assignedDriverId;

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                {vehicle.vehicleId}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                vehicle.status === 'available' ? 'bg-emerald-500/10 text-emerald-600' :
                vehicle.status === 'on_dispatch' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {vehicle.status.replace('_', ' ')}
              </span>
            </div>
            <PageHeader 
              title={vehicle.name}
              description={`Reg: ${vehicle.plateNumber} • Category: ${vehicle.type}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Green Driver WhatsApp Action Button */}
          {driver && (
            <a href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 font-bold">
                <MessageSquare className="w-4 h-4" />
                <span>{t('hr.whatsAppDriver')}</span>
              </Button>
            </a>
          )}

          {/* Edit */}
          <ActionGuard permission="hr.update">
            <Button variant="outline" onClick={() => router.push(`/hr/vehicles/${vehicle._id}/edit`)} className="gap-2 font-bold">
              <Edit className="w-4 h-4" />
              <span>{t('hr.editVehicle')}</span>
            </Button>
          </ActionGuard>

          {/* Delete */}
          <ActionGuard permission="hr.delete">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(true)} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('hr.vehicleCategory')}
          value={vehicle.type}
          icon={Truck}
          colorTheme="primary"
        />
        <StatsCard
          title={t('hr.payloadCapacity')}
          value={vehicle.capacity || '1.5 Tons'}
          icon={Car}
          colorTheme="secondary"
        />
        <StatsCard
          title={t('hr.currentStatus')}
          value={vehicle.status.replace('_', ' ').toUpperCase()}
          icon={vehicle.status === 'available' ? CheckCircle2 : vehicle.status === 'on_dispatch' ? Truck : Wrench}
          colorTheme={vehicle.status === 'available' ? 'success' : vehicle.status === 'on_dispatch' ? 'warning' : 'error'}
        />
        <StatsCard
          title={t('hr.fleetOwnership')}
          value={vehicle.ownership.toUpperCase()}
          icon={Shield}
          colorTheme="primary"
        />
      </div>

      {/* Specification & Driver Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vehicle Specification Card */}
        <Card className="w-full border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle>{t('hr.vehicleSpecs')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.modelName')}</p>
                <p className="font-bold text-foreground mt-0.5">{vehicle.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.regPlateNumber')}</p>
                <p className="font-bold font-mono text-foreground mt-0.5">{vehicle.plateNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.carryingPayload')}</p>
                <p className="font-semibold text-foreground mt-0.5">{vehicle.capacity || '1.5 Tons'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.ownershipType')}</p>
                <p className="font-semibold text-foreground capitalize mt-0.5">{vehicle.ownership} Vehicle</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Driver Profile Card */}
        <Card className="w-full border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
            <CardTitle>{t('hr.assignedDriverProfile')}</CardTitle>
            {driver && (
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded uppercase">
                {t('hr.activeDriver')}
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {driver ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-base">{driver.name}</h4>
                    <p className="text-xs text-muted-foreground font-semibold">{driver.phone} • {driver.role}</p>
                  </div>
                </div>

                <a href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 font-bold">
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                {t('hr.noDriverAssigned')}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('hr.deleteVehicleTitle')}
        message={t('hr.deleteVehicleMsg')}
      />

    </div>
  );
}
