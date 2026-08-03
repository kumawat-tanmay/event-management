import apiClient from '../apiClient';

export interface LedgerItem {
  _id: string;
  type: 'receipt' | 'payment';
  source: string;
  reference: string;
  details: string;
  amount: number;
  date: string;
  notes?: string;
  mode?: string;
  transactionId?: string;
  runningBalance: number;
}

export interface CashbookSummary {
  totalCashIn: number;
  totalCashOut: number;
  currentBalance: number;
}

export interface BankbookSummary {
  totalBankIn: number;
  totalBankOut: number;
  currentBalance: number;
}

export interface EventProfitLoss {
  eventTitle: string;
  bookingId: string;
  grandTotal: number;
  totalPaymentsReceived: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string;
  expensesList: any[];
}

export interface CompanyProfitLoss {
  totalRevenue: number;
  totalOperationalExpenses: number;
  totalVendorPayments: number;
  totalOutflow: number;
  netCompanyProfit: number;
  profitMargin: string;
}

export const financeService = {
  getCashbook: async (params?: any): Promise<{ summary: CashbookSummary; ledger: LedgerItem[] }> => {
    const res = await apiClient.get('/finance/cashbook', { params });
    return res.data.data;
  },

  getBankbook: async (params?: any): Promise<{ summary: BankbookSummary; ledger: LedgerItem[] }> => {
    const res = await apiClient.get('/finance/bankbook', { params });
    return res.data.data;
  },

  getProfitLoss: async (params?: any): Promise<any> => {
    const res = await apiClient.get('/finance/profit-loss', { params });
    return res.data.data;
  }
};
