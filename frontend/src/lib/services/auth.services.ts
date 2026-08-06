import apiClient, { setCsrfToken } from '../apiClient';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.data?.csrfToken) {
      setCsrfToken(response.data.data.csrfToken);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network error during logout
    } finally {
      setCsrfToken(null);
    }
  },

  googleLogin: async (accessToken: string) => {
    // Backend receives this as 'code' field and uses it as access_token
    const response = await apiClient.post('/auth/google', { code: accessToken });
    if (response.data?.data?.csrfToken) {
      setCsrfToken(response.data.data.csrfToken);
    }
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  },

  resetPassword: async (password: string, token: string) => {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await apiClient.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePassword: async (data: any) => {
    const response = await apiClient.put('/auth/updatepassword', data);
    return response.data;
  }
};
