import apiClient from '../apiClient';

export interface AuditLog {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  module: string;
  description: string;
  ipAddress?: string;
  details?: any;
  createdAt: string;
  updatedAt: string;
}

export const auditService = {
  getAuditLogs: async (params?: any): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit', { params });
    return res.data.data;
  }
};
