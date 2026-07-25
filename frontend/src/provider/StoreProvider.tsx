'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React, { useEffect } from 'react';
import { initializeAuth, logout } from '@/store/slices/authSlice';
import { USER_KEY } from '@/lib/apiClient';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initial Load
    store.dispatch(initializeAuth());

    // 2. Cross-Tab Sync (Logout in one tab -> Logout in all)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY && !e.newValue) {
        store.dispatch(logout());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return <>{children}</>;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
