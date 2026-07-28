import apiClient from '../apiClient';

export interface Customer {
  _id: string;
  name: string;
  type: 'Retail' | 'Corporate';
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  gstNumber?: string;
  creditLimit?: number;
  paymentTerms?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Lead {
  _id: string;
  leadId: string;
  customerName: string;
  phone: string;
  email?: string;
  eventType: string;
  eventDate?: string;
  source: string;
  stage: 'New' | 'Contacted' | 'Site Visit' | 'Quotation' | 'Booked' | 'Lost';
  assignedStaff?: any;
  notes?: string;
  createdAt?: string;
}

export interface SiteVisit {
  _id: string;
  lead?: any;
  customerName: string;
  phone: string;
  visitDate: string;
  venueAddress: string;
  assignedStaff?: any;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt?: string;
}

export interface GetCustomersResponse {
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export const crmService = {
  // ─── Customers ─────────────────────────────────────────────────────────────
  getCustomers: async (params?: { type?: string; search?: string; page?: number; limit?: number }): Promise<GetCustomersResponse> => {
    const res = await apiClient.get('/crm/customers', { params });
    return res.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const res = await apiClient.get(`/crm/customers/${id}`);
    return res.data.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const res = await apiClient.post('/crm/customers', data);
    return res.data.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await apiClient.put(`/crm/customers/${id}`, data);
    return res.data.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/crm/customers/${id}`);
  },

  // ─── Leads ─────────────────────────────────────────────────────────────────
  getLeads: async (params?: { stage?: string; search?: string; phone?: string; customerName?: string }): Promise<Lead[]> => {
    const res = await apiClient.get('/crm/leads', { params });
    return res.data.data;
  },

  getLeadById: async (id: string): Promise<Lead> => {
    const res = await apiClient.get(`/crm/leads/${id}`);
    return res.data.data;
  },

  createLead: async (data: Partial<Lead>): Promise<Lead> => {
    const res = await apiClient.post('/crm/leads', data);
    return res.data.data;
  },

  updateLead: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const res = await apiClient.put(`/crm/leads/${id}`, data);
    return res.data.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/crm/leads/${id}`);
  },

  // ─── Site Visits ───────────────────────────────────────────────────────────
  getSiteVisits: async (params?: { phone?: string; customerName?: string; leadId?: string }): Promise<SiteVisit[]> => {
    const res = await apiClient.get('/crm/site-visits', { params });
    return res.data.data;
  },

  getSiteVisitById: async (id: string): Promise<SiteVisit> => {
    const res = await apiClient.get(`/crm/site-visits/${id}`);
    return res.data.data;
  },

  createSiteVisit: async (data: Partial<SiteVisit>): Promise<SiteVisit> => {
    const res = await apiClient.post('/crm/site-visits', data);
    return res.data.data;
  },

  updateSiteVisit: async (id: string, data: Partial<SiteVisit>): Promise<SiteVisit> => {
    const res = await apiClient.put(`/crm/site-visits/${id}`, data);
    return res.data.data;
  },

  deleteSiteVisit: async (id: string): Promise<void> => {
    await apiClient.put(`/crm/site-visits/${id}`, { isDeleted: true });
  }
};
