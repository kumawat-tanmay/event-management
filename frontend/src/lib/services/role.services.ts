import apiClient, { ApiResponse } from '../apiClient';

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
}

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>('/roles');
    return response.data.data;
  },

  getRoleById: async (id: string): Promise<Role | null> => {
    const roles = await roleService.getRoles();
    return roles.find(r => r._id === id) || null;
  },

  createRole: async (data: { name: string; permissions: string[] }): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>('/roles', data);
    return response.data.data;
  },

  updateRole: async (id: string, data: { name: string; permissions: string[] }): Promise<Role> => {
    const response = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return response.data.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  }
};
