import apiClient from '../apiClient';

export interface TransferItemInput {
  item: string;
  name: string;
  code?: string;
  quantity: number;
}

export interface CreateTransferPayload {
  fromWarehouse: string;
  toWarehouse: string;
  remarks?: string;
  items: TransferItemInput[];
}

export const warehouseTransferService = {
  getTransfers: async (params?: { status?: string; search?: string }) => {
    const res = await apiClient.get('/warehouse-transfers', { params });
    return res.data.data;
  },

  getTransferById: async (id: string) => {
    const res = await apiClient.get(`/warehouse-transfers/${id}`);
    return res.data.data;
  },

  createTransfer: async (payload: CreateTransferPayload) => {
    const res = await apiClient.post('/warehouse-transfers', payload);
    return res.data;
  },

  updateTransfer: async (id: string, payload: CreateTransferPayload) => {
    const res = await apiClient.put(`/warehouse-transfers/${id}`, payload);
    return res.data;
  },

  approveTransfer: async (id: string) => {
    const res = await apiClient.post(`/warehouse-transfers/${id}/approve`);
    return res.data;
  },

  receiveTransfer: async (id: string) => {
    const res = await apiClient.post(`/warehouse-transfers/${id}/receive`);
    return res.data;
  },

  cancelTransfer: async (id: string) => {
    const res = await apiClient.post(`/warehouse-transfers/${id}/cancel`);
    return res.data;
  },

  deleteTransfer: async (id: string) => {
    const res = await apiClient.delete(`/warehouse-transfers/${id}`);
    return res.data;
  },
};
