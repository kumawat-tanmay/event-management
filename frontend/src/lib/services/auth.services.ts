import apiClient from '../apiClient';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: () => {
    // the logout is fully handled by AuthContext now (removes cookie)
    // we just have an empty service method if we ever need backend invalidation
  },

  googleLogin: async (accessToken: string) => {
    // Backend receives this as 'code' field and uses it as access_token
    const response = await apiClient.post('/auth/google', { code: accessToken });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  },

  resetPassword: async (password: string, token: string) => {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  }
};
