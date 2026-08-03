import apiClient from '../apiClient';

export interface Expense {
  _id: string;
  category: 'Transport' | 'Material Purchase' | 'Maintenance' | 'Staff Salary' | 'Other';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceId?: any; // staff, booking, or vendor object
  refModel?: 'Staff' | 'Booking' | 'Vendor' | 'Vehicle' | 'Other';
  notes?: string;
  date: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  category?: 'Transport' | 'Material Purchase' | 'Maintenance' | 'Staff Salary' | 'Other';
  amount: number;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceId?: string;
  refModel?: 'Staff' | 'Booking' | 'Vendor' | 'Vehicle' | 'Other';
  notes?: string;
  date?: string;
}

export const expenseService = {
  createExpense: async (data: ExpenseInput): Promise<Expense> => {
    const res = await apiClient.post('/expenses', data);
    return res.data.data;
  },

  getExpenses: async (params?: any): Promise<Expense[]> => {
    const res = await apiClient.get('/expenses', { params });
    return res.data.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const res = await apiClient.get(`/expenses/${id}`);
    return res.data.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  }
};
