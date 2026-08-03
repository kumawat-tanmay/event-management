import apiClient from '../apiClient';

export interface DispatchItemInput {
  item: string;
  name: string;
  code?: string;
  dispatchedQty: number;
}

export interface CreateDispatchPayload {
  bookingId: string;
  warehouseId: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  gatePassNumber?: string;
  items: DispatchItemInput[];
}

export const dispatchService = {
  getDispatches: async (params?: { status?: string; search?: string; warehouseId?: string; bookingId?: string }) => {
    const res = await apiClient.get('/dispatches', { params });
    return res.data.data;
  },

  getDispatchById: async (id: string) => {
    const res = await apiClient.get(`/dispatches/${id}`);
    return res.data.data;
  },

  createDispatch: async (payload: CreateDispatchPayload) => {
    const res = await apiClient.post('/dispatches', payload);
    return res.data;
  },

  updateDispatch: async (id: string, payload: CreateDispatchPayload) => {
    const res = await apiClient.put(`/dispatches/${id}`, payload);
    return res.data;
  },

  updateDispatchStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/dispatches/${id}/status`, { status });
    return res.data;
  },

  deleteDispatch: async (id: string) => {
    const res = await apiClient.delete(`/dispatches/${id}`);
    return res.data;
  },
};
