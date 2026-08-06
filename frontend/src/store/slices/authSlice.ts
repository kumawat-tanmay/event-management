import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import { AuthUser, TOKEN_KEY, USER_KEY, CSRF_TOKEN_KEY, setCsrfToken } from '@/lib/apiClient';

/**
 * 🔒 Advanced Auth Slice
 * Features: Hydration Guard, Persistence, Cross-Tab Sync
 * Customized for krishna-event-erp
 */

const TOKEN_EXPIRY_KEY = 'krishna_token_expiry';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  globalEnv: Record<string, string>;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  globalEnv: {},
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth: (state) => {
      if (typeof window === 'undefined') return;

      // Legacy cleanup: remove old role cookie (now stored in localStorage)
      Cookies.remove('krishna_user_role', { path: '/' });

      const token = Cookies.get(TOKEN_KEY);
      const userRaw = localStorage.getItem(USER_KEY);
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      try {
        if (expiry && Date.now() > parseInt(expiry)) {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
          Cookies.remove(TOKEN_KEY, { path: '/' });
          localStorage.removeItem('krishna_user_role');
          state.isInitialized = true;
          return;
        }

        if (token && userRaw) {
          const user = JSON.parse(userRaw);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;

          Cookies.set(TOKEN_KEY, token, {
            expires: 30, path: '/', sameSite: 'strict', secure: process.env.NEXT_PUBLIC_SECURE_COOKIES === 'true'
          });
          const initRoleStr = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
          localStorage.setItem('krishna_user_role', initRoleStr as string);
        }
      } catch (error) {
        console.error('Auth sync failed:', error);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        Cookies.remove(TOKEN_KEY);
        localStorage.removeItem('krishna_user_role');
      } finally {
        state.isInitialized = true;
      }
    },

    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token: string; expiresAt?: number }>) => {
      const { user, token, expiresAt } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        const expiry = expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));

        const cookieExpireDays = Math.max(1, Math.round((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
        Cookies.set(TOKEN_KEY, token, {
          expires: cookieExpireDays, path: '/', sameSite: 'strict', secure: process.env.NEXT_PUBLIC_SECURE_COOKIES === 'true'
        });
        
        const roleStr = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
        localStorage.setItem('krishna_user_role', roleStr as string);
      }
    },

    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        }
        
        if (action.payload.role) {
          const roleStr = typeof action.payload.role === 'object' && action.payload.role !== null ? action.payload.role.name : action.payload.role;
          localStorage.setItem('krishna_user_role', roleStr as string);
        }
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
        setCsrfToken(null);
        Cookies.remove(TOKEN_KEY, {
          path: '/',
          sameSite: 'strict',
          secure: process.env.NEXT_PUBLIC_SECURE_COOKIES === 'true'
        });
        localStorage.removeItem('krishna_user_role');
      }
    },

    setGlobalEnv: (state, action: PayloadAction<Record<string, string>>) => {
      state.globalEnv = action.payload;
      if (typeof window !== 'undefined' && action.payload.NEXT_PUBLIC_SECURE_COOKIES) {
        localStorage.setItem('krishna_globalEnv_secure_cookies', action.payload.NEXT_PUBLIC_SECURE_COOKIES);
      }
    }
  },
});

export const { initializeAuth, setCredentials, updateUser, logout, setGlobalEnv } = authSlice.actions;
export default authSlice.reducer;
