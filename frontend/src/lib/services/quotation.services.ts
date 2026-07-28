import apiClient from '../apiClient';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export interface QuotationItem {
  item: string;
  itemName: string;
  itemCode?: string;
  unit?: string;
  rentalRate: number;
  quantity: number;
  duration: number;
  discount?: number;
  totalAmount: number;
}

export interface Quotation {
  _id: string;
  quotationId: string;
  customer: any;
  lead?: any;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  venueAddress: string;
  items: QuotationItem[];
  subtotal: number;
  transportCharges: number;
  labourCharges: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  discount: number;
  termsAndConditions?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Converted';
  validUntil?: string;
  notes?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationStats {
  total: number;
  draft: number;
  sent: number;
  approved: number;
  converted: number;
  rejected: number;
  totalValue: number;
}

export interface StockAvailabilityItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: string;
  category: string;
  requestedQty: number;
  warehouses: {
    warehouseId: string;
    warehouseName: string;
    totalStock: number;
    reserved: number;
    dispatched: number;
    damaged: number;
    available: number;
  }[];
  totalAvailable: number;
  isFullyAvailable: boolean;
  shortfall: number;
}

export interface GetQuotationsResponse {
  data: Quotation[];
  stats: QuotationStats;
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

// ─── Quotation Service ──────────────────────────────────────────────────────

export const quotationService = {
  getQuotations: async (params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<GetQuotationsResponse> => {
    const res = await apiClient.get('/quotations', { params });
    return res.data;
  },

  getQuotationById: async (id: string): Promise<Quotation> => {
    const res = await apiClient.get(`/quotations/${id}`);
    return res.data.data;
  },

  createQuotation: async (data: Partial<Quotation>): Promise<Quotation> => {
    const res = await apiClient.post('/quotations', data);
    return res.data.data;
  },

  updateQuotation: async (id: string, data: Partial<Quotation>): Promise<Quotation> => {
    const res = await apiClient.put(`/quotations/${id}`, data);
    return res.data.data;
  },

  deleteQuotation: async (id: string): Promise<void> => {
    await apiClient.delete(`/quotations/${id}`);
  },

  checkStock: async (
    items: { item: string; quantity: number }[],
    eventStartDate: string,
    eventEndDate: string
  ): Promise<{ data: StockAvailabilityItem[]; allAvailable: boolean }> => {
    const res = await apiClient.post('/quotations/check-stock', {
      items,
      eventStartDate,
      eventEndDate
    });
    return res.data;
  },

  convertToBooking: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/quotations/${id}/convert-booking`);
    return res.data.data;
  }
};
