import apiClient from '../apiClient';

export interface GrowthPoint {
  date: string;
  revenue: number;
  expenses: number;
}

export interface GrowthAnalysisData {
  monthly: GrowthPoint[];
  weekly: GrowthPoint[];
  daily: GrowthPoint[];
}

export interface DashboardStats {
  summary: {
    todaysEvents: number;
    todaysDispatches: number;
    todaysReturns: number;
    pendingPayments: number;
    availableStock: number;
    materialAtSite: number;
    staffPresent: string;
  };
  growthAnalysis: GrowthAnalysisData | GrowthPoint[];
  categoryBreakdown: Record<string, number>;
  recentBookings: {
    _id: string;
    bookingId: string;
    eventTitle: string;
    eventType: string;
    customerName: string;
    grandTotal: number;
    advancePaid: number;
    balanceAmount: number;
    status: string;
    date: string;
    venueAddress: string;
  }[];
  warehouseSummary: {
    _id: string;
    name: string;
    available: number;
    reserved: number;
    atSite: number;
    damaged: number;
  }[];
  inventoryBreakdown: {
    label: string;
    value: number;
    color: string;
  }[];
  materialFlow: {
    available: number;
    reserved: number;
    loading: number;
    dispatched: number;
    atSite: number;
    returned: number;
  };
  pendingDispatches: {
    _id: string;
    dispatchId: string;
    eventTitle: string;
    date: string;
    status: string;
  }[];
  pendingReturns: {
    _id: string;
    dispatchId: string;
    eventTitle: string;
    date: string;
    status: string;
  }[];
  upcomingEvents: {
    _id: string;
    date: string;
    endDate: string;
    title: string;
    venue: string;
    type: string;
    customerName: string;
    status: string;
  }[];
  dispatchTimeline: {
    stage: string;
    count: number;
    color: string;
  }[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data.data;
  }
};
