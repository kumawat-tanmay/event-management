import apiClient from '../apiClient';

export interface Category {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryInput = Omit<Category, '_id' | 'createdAt' | 'updatedAt' | 'itemsCount'>;

export interface WarehouseStockEntry {
  warehouse: { _id: string; name: string } | string;
  zoneId?: string;
  rackId?: string;
  quantity: number;
  reserved: number;
  dispatched: number;
  damaged: number;
}

export interface Item {
  _id: string;
  name: string;
  code: string;
  category: { _id: string; name: string } | string;
  description?: string;
  unit: string;
  rentalPrice: number;
  purchaseCost: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
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
  category: string;
  description?: string;
  unit: string;
  rentalPrice: number;
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
  category?: string;
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
  // ─── Categories ─────────────────────────────────────────────────────────────
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/inventory/categories');
    return res.data.data;
  },

  getCategoryById: async (id: string): Promise<Category & { items: Item[] }> => {
    const res = await apiClient.get(`/inventory/categories/${id}`);
    return res.data.data;
  },

  createCategory: async (data: CategoryInput): Promise<Category> => {
    const res = await apiClient.post('/inventory/categories', data);
    return res.data.data;
  },

  updateCategory: async (id: string, data: Partial<CategoryInput>): Promise<Category> => {
    const res = await apiClient.put(`/inventory/categories/${id}`, data);
    return res.data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/categories/${id}`);
  },

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
