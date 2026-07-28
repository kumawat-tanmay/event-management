import apiClient from '../apiClient';

export interface Rack {
  _id?: string;
  name: string;
  capacity?: string;
  description?: string;
}

export interface Zone {
  _id?: string;
  name: string;
  description?: string;
  racks: Rack[];
}

export interface Warehouse {
  _id: string;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  phone?: string;
  capacity?: number;
  isDefault?: boolean;
  managerId?: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  zones: Zone[];
  createdAt: string;
  updatedAt: string;
}

export type WarehouseInput = Omit<Warehouse, '_id' | 'createdAt' | 'updatedAt' | 'managerId'> & {
  managerId?: string | null;
};

export const warehouseService = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const res = await apiClient.get('/warehouses');
    return res.data.data;
  },

  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const res = await apiClient.get(`/warehouses/${id}`);
    return res.data.data;
  },

  createWarehouse: async (data: WarehouseInput): Promise<Warehouse> => {
    const res = await apiClient.post('/warehouses', data);
    return res.data.data;
  },

  updateWarehouse: async (id: string, data: Partial<WarehouseInput>): Promise<Warehouse> => {
    const res = await apiClient.put(`/warehouses/${id}`, data);
    return res.data.data;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  }
};
