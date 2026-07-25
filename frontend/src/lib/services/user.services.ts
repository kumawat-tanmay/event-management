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
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data.data;
  },

  inviteUser: async (data: { name: string; email: string; role: string }): Promise<User> => {
    const res = await apiClient.post('/users/invite', data);
    return res.data.data;
  }
};
