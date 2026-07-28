import apiClient from '../apiClient';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export interface BookingItem {
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

export interface Booking {
  _id: string;
  bookingId: string;
  quotation?: any;
  customer: any;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  venueAddress: string;
  items: BookingItem[];
  subtotal: number;
  transportCharges: number;
  labourCharges: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  advanceRequired: number;
  advancePaid: number;
  balanceAmount: number;
  assignedSupervisor?: any;
  status: 'Draft' | 'Confirmed' | 'Planning' | 'InProgress' | 'Completed' | 'Cancelled';
  agreementSigned: boolean;
  agreementSignedAt?: string;
  notes?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingStats {
  total: number;
  draft: number;
  confirmed: number;
  planning: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalValue: number;
  totalAdvance: number;
  totalBalance: number;
}

export interface GetBookingsResponse {
  data: Booking[];
  stats: BookingStats;
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

// ─── Booking Service ────────────────────────────────────────────────────────

export const bookingService = {
  getBookings: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<GetBookingsResponse> => {
    const res = await apiClient.get('/bookings', { params });
    return res.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data.data;
  },

  createBooking: async (data: Partial<Booking>): Promise<Booking> => {
    const res = await apiClient.post('/bookings', data);
    return res.data.data;
  },

  updateBooking: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    const res = await apiClient.put(`/bookings/${id}`, data);
    return res.data.data;
  },

  deleteBooking: async (id: string): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },

  signAgreement: async (id: string): Promise<Booking> => {
    const res = await apiClient.post(`/bookings/${id}/agreement`);
    return res.data.data;
  }
};
