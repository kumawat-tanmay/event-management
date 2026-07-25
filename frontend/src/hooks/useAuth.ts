import { useAppSelector, useAppDispatch } from '../store/hooks/redux';
import { logout as logoutAction, setCredentials } from '../store/slices/authSlice';
import { authService } from '../lib/services/auth.services';
import { AuthUser, Role } from '../lib/apiClient';

/**
 * Custom hook for accessing authentication state and actions
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  const login = (user: AuthUser, token: string, expiresAt?: number) => {
    dispatch(setCredentials({ user, token, expiresAt }));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API failed, forcing local logout:', error);
    } finally {
      dispatch(logoutAction());
      window.location.href = '/login'; // Force redirect and clear state
    }
  };

  // Safely extract role name whether it is populated or just a string/id
  const getRoleName = () => {
    if (!user || !user.role) return 'staff';
    if (typeof user.role === 'object' && 'name' in user.role) {
      return (user.role as Role).name;
    }
    return user.role; // Fallback if it's just a string ID
  };

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    role: getRoleName(),
  };
};
