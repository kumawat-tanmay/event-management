import api from '../apiClient';

export interface PaymentLog {
  _id?: string;
  date: string;
  amount: number;
  type: 'Salary' | 'Advance' | 'Allowance' | 'Bonus';
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  notes?: string;
}

export interface Staff {
  _id: string;
  staffId: string;
  name: string;
  phone: string;
  email?: string;
  role: 'Driver' | 'Event Supervisor' | 'Godown Manager' | 'Labour' | 'Accountant' | 'Other';
  joinedDate?: string;
  compensationType: 'daily' | 'monthly';
  basePay: number;
  totalPaid: number;
  pendingDues: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  paymentHistory?: PaymentLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffInput {
  name: string;
  phone: string;
  email?: string;
  role: string;
  joinedDate?: string;
  compensationType?: 'daily' | 'monthly';
  basePay?: number;
  totalPaid?: number;
  pendingDues?: number;
  status?: string;
}

export interface Vehicle {
  _id: string;
  vehicleId: string;
  name: string;
  plateNumber: string;
  type: 'Pickup 407' | 'Tata Ace' | 'Heavy Truck' | 'Bolero' | 'Van' | 'Tractor' | 'Other';
  capacity: string;
  assignedDriverId?: Staff | null;
  status: 'available' | 'on_dispatch' | 'maintenance';
  ownership: 'company' | 'rented';
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleInput {
  name: string;
  plateNumber: string;
  type?: string;
  capacity?: string;
  assignedDriverId?: string | null;
  status?: string;
  ownership?: string;
}

export const hrService = {
  // Staff Services
  getStaff: async (): Promise<Staff[]> => {
    const response = await api.get('/hr/staff');
    return response.data?.data || response.data || [];
  },

  getStaffById: async (id: string): Promise<Staff> => {
    const response = await api.get(`/hr/staff/${id}`);
    return response.data?.data || response.data;
  },

  createStaff: async (data: StaffInput): Promise<Staff> => {
    const response = await api.post('/hr/staff', data);
    return response.data?.data || response.data;
  },

  updateStaff: async (id: string, data: Partial<StaffInput>): Promise<Staff> => {
    const response = await api.put(`/hr/staff/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteStaff: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/hr/staff/${id}`);
    return response.data;
  },

  logPayment: async (id: string, paymentData: { amount?: number; type?: string; mode?: string; notes?: string; newPendingDues?: number }): Promise<Staff> => {
    const response = await api.post(`/hr/staff/${id}/pay`, paymentData);
    return response.data?.data || response.data;
  },

  // Vehicle Services
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/hr/vehicles');
    return response.data?.data || response.data || [];
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/hr/vehicles/${id}`);
    return response.data?.data || response.data;
  },

  createVehicle: async (data: VehicleInput): Promise<Vehicle> => {
    const response = await api.post('/hr/vehicles', data);
    return response.data?.data || response.data;
  },

  updateVehicle: async (id: string, data: Partial<VehicleInput>): Promise<Vehicle> => {
    const response = await api.put(`/hr/vehicles/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteVehicle: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/hr/vehicles/${id}`);
    return response.data;
  }
};
