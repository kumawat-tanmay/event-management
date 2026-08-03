import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * 🚀 Advanced Krishna Event ERP API Client
 * Synced exactly with Node.js backend User and auth requirements.
 */

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const TOKEN_KEY = 'krishna_token';
export const USER_KEY = 'krishna_user_data';

// ─── Synchronized Types (ERP Backend Model: User) ─────────────
export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role | string; // Populated Role object or Role ID
  avatar?: string;
  isActive: boolean;
  isDeleted: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Allow future dynamic fields
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

// ─── Base URL Configuration ──────────────────────────────────────────────────
export const getBackendBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://event-management-x2m7.vercel.app/api';
  return url.replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, "");
};

export const getBackendHostUrl = () => {
  const baseUrl = getBackendBaseUrl();
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return baseUrl.replace('/api', '');
  }
};

const apiClient = axios.create({
  baseURL: getBackendBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Required for CSRF cookies to be sent and received
});

let csrfToken: string | null = null;
let isFetchingCsrf = false;
let csrfPromise: Promise<string> | null = null;

// Function to fetch CSRF token from backend
const fetchCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  if (isFetchingCsrf && csrfPromise) return csrfPromise;

  isFetchingCsrf = true;
  csrfPromise = axios.get(`${getBackendBaseUrl()}/csrf-token`, { withCredentials: true })
    .then(res => {
      csrfToken = res.data.csrfToken;
      isFetchingCsrf = false;
      return csrfToken as string;
    })
    .catch(err => {
      console.error('Failed to fetch CSRF token', err);
      isFetchingCsrf = false;
      return '';
    });

  return csrfPromise;
};

// ─── Request Interceptor (Security & Files) ──────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      // 0. Inject CSRF Token for state-changing requests
      if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
        const token = await fetchCsrfToken();
        if (token) {
          config.headers['x-csrf-token'] = token;
        }
      }

      // 1. Dual-Storage Token Recovery
      const token = Cookies.get(TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Automatic Multipart/Form-Data Handling (for Profile Photos/Documents)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Anti-Crash & Auto-Logout) ─────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const resData = error.response?.data;
    
    // 1. Smart logout: Only logout when the token itself is expired/invalid
    const isDeactivated = error.response?.status === 403 && resData?.message?.toLowerCase().includes('deactivated');

    // 1.5 Handle CSRF Token Expiration (403 Forbidden with CSRF message)
    const isCsrfFailure = error.response?.status === 403 && resData?.message?.toLowerCase().includes('csrf');
    if (isCsrfFailure && !error.config._retry) {
      error.config._retry = true;
      csrfToken = null; // Force clear the stale token
      
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          error.config.headers['x-csrf-token'] = newToken;
          // Retry the original request with the new token
          return apiClient(error.config);
        }
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    const isGenuineAuthFailure = error.response?.status === 401 && (
      resData?.message?.toLowerCase().includes('no longer exists') ||
      resData?.message?.toLowerCase().includes('jwt expired') ||
      resData?.message?.toLowerCase().includes('invalid signature') ||
      resData?.message?.toLowerCase().includes('invalid token') ||
      resData?.message?.toLowerCase().includes('not authorized')
    );

    if ((isGenuineAuthFailure || isDeactivated)) {
      if (typeof window !== 'undefined') {
        const cookieOptions: Cookies.CookieAttributes = {
          path: '/',
          sameSite: 'strict',
          secure: process.env.NEXT_PUBLIC_SECURE_COOKIES === 'true'
        };
        Cookies.remove(TOKEN_KEY, cookieOptions);
        Cookies.remove('krishna_user_role', cookieOptions);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('krishna_token_expiry');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // 2. Extract Backend Error Message (Prevents Generic "Axios Error")
    if (resData && resData.message) {
      error.message = resData.message;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
