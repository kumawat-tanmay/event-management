import apiClient from '../apiClient';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  bookingId: {
    _id: string;
    bookingId: string;
    eventTitle: string;
    eventStartDate: string;
    grandTotal: number;
    balanceAmount: number;
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    items?: any[];
    customer?: {
      _id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      gstNumber?: string;
    };
  };
  date: string;
  subtotal: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  discount: number;
  status: 'Paid' | 'Unpaid' | 'Cancelled';
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const invoiceService = {
  createInvoice: async (data: { bookingId: string; discount?: number }): Promise<Invoice> => {
    const res = await apiClient.post('/invoices/generate', data);
    return res.data.data;
  },

  getInvoices: async (params?: any): Promise<Invoice[]> => {
    const res = await apiClient.get('/invoices', { params });
    return res.data.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get(`/invoices/${id}`);
    return res.data.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  }
};
