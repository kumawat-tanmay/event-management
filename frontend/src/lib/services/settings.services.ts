import apiClient from '../apiClient';

export interface CompanySettings {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  logo?: string;
  isSetupComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const settingsService = {
  getCompany: async (): Promise<CompanySettings> => {
    const res = await apiClient.get('/settings/company');
    return res.data.data;
  },

  updateCompany: async (formData: FormData | Partial<CompanySettings>): Promise<CompanySettings> => {
    let res;
    if (formData instanceof FormData) {
      res = await apiClient.put('/settings/company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      res = await apiClient.put('/settings/company', formData);
    }
    return res.data.data;
  },
};
