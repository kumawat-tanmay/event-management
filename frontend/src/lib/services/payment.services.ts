import apiClient from '../apiClient';

export interface Payment {
  _id: string;
  bookingId?: {
    _id: string;
    bookingId: string;
    eventTitle: string;
    grandTotal: number;
    advancePaid: number;
    balanceAmount: number;
  };
  customerId?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  amount: number;
  paymentType: 'advance' | 'final' | 'security_deposit' | 'security_refund' | 'refund' | 'vendor_payment';
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionId?: string;
  transactionDate: string;
  notes?: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInput {
  bookingId?: string;
  customerId?: string;
  amount: number;
  paymentType?: 'advance' | 'final' | 'security_deposit' | 'security_refund' | 'refund' | 'vendor_payment';
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionId?: string;
  transactionDate?: string;
  notes?: string;
}

export const paymentService = {
  createPayment: async (data: PaymentInput): Promise<Payment> => {
    const res = await apiClient.post('/payments', data);
    return res.data.data;
  },

  getPayments: async (params?: any): Promise<Payment[]> => {
    const res = await apiClient.get('/payments', { params });
    return res.data.data;
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const res = await apiClient.get(`/payments/${id}`);
    return res.data.data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
  }
};
