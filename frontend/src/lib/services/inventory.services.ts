import apiClient from '../apiClient';

export interface WarehouseStockEntry {
  warehouse: { _id: string; name: string } | string;
  zoneId?: string;
  rackId?: string;
  quantity: number;
  dispatched: number;
  damaged: number;
}

export interface Item {
  _id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  rentalPrice: number;
  purchaseCost: number;
  totalStock: number;
  availableStock: number;
  dispatchedStock: number;
  damagedStock: number;
  warehouseStock: WarehouseStockEntry[];
  minStockAlert: number;
  isActive: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemInput = {
  name: string;
  code?: string;
  description?: string;
  unit: string;
  totalStock?: number;
  purchaseCost: number;
  minStockAlert: number;
  isActive: boolean;
  image?: string;
};

export interface LedgerEntry {
  _id: string;
  item: { _id: string; name: string; code: string; unit?: string };
  warehouse: { _id: string; name: string };
  type: 'OPENING_STOCK' | 'STOCK_IN' | 'STOCK_OUT' | 'RESERVED' | 'RELEASED' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DAMAGED' | 'REPAIRED' | 'SCRAPPED' | 'ADJUSTMENT';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  referenceType?: string;
  remarks?: string;
  performedBy: { _id: string; name: string };
  createdAt: string;
}

export interface GetItemsResponse {
  data: Item[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GetLedgerResponse {
  data: LedgerEntry[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GetItemsParams {
  status?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetLedgerParams {
  item?: string;
  warehouse?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const inventoryService = {
  // ─── Items ──────────────────────────────────────────────────────────────────
  getItems: async (params?: GetItemsParams): Promise<GetItemsResponse> => {
    const res = await apiClient.get('/inventory/items', { params });
    return res.data;
  },

  getItemById: async (id: string): Promise<Item> => {
    const res = await apiClient.get(`/inventory/items/${id}`);
    return res.data.data;
  },

  adjustStock: async (id: string, data: { warehouseId: string; quantity: number; zoneId?: string; rackId?: string; notes?: string }): Promise<Item> => {
    const res = await apiClient.post(`/inventory/items/${id}/adjust-stock`, data);
    return res.data.data;
  },

  createItem: async (data: ItemInput): Promise<Item> => {
    const res = await apiClient.post('/inventory/items', data);
    return res.data.data;
  },

  updateItem: async (id: string, data: Partial<ItemInput>): Promise<Item> => {
    const res = await apiClient.put(`/inventory/items/${id}`, data);
    return res.data.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/items/${id}`);
  },

  // ─── Opening Stock ──────────────────────────────────────────────────────────
  addOpeningStock: async (itemId: string, warehouseId: string, quantity: number, zoneId?: string, rackId?: string): Promise<Item> => {
    const res = await apiClient.post(`/inventory/items/${itemId}/opening-stock`, {
      warehouseId,
      quantity,
      zoneId,
      rackId
    });
    return res.data.data;
  },

  // ─── Ledger ──────────────────────────────────────────────────────────────────
  getLedger: async (params?: GetLedgerParams): Promise<GetLedgerResponse> => {
    const res = await apiClient.get('/inventory/ledger', { params });
    return res.data;
  }
};
