'use client';

import React from 'react';
import { VehicleForm } from '@/components/dashboard/hr/vehicles/VehicleForm';

export default function EditVehiclePage() {
  return <VehicleForm isEdit={true} />;
}