import apiClient from '../apiClient';

export const reportService = {
  getReport: async (reportType: string, params?: any): Promise<any> => {
    const res = await apiClient.get(`/reports/${reportType}`, { params });
    return res.data.data;
  }
};
