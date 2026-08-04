import apiClient, { ApiResponse } from '../apiClient';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  isActive: boolean;
  createdAt: string;
  invitedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  description?: string;
  avatar?: string;
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data.data;
  },

  inviteUser: async (data: { name: string; email: string; role: string }): Promise<User> => {
    const res = await apiClient.post('/users/invite', data);
    return res.data.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};
