'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 🔒 AuthGuard
 * SEO + Accessibility Optimized
 * Prevents unauthenticated users from accessing protected pages.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Loading State
  if (!isInitialized || !isAuthenticated) {
    return (
      <section
        className="h-screen w-full flex items-center justify-center bg-background"
        aria-label="Authentication loading screen"
      >
        {/* SEO Hidden H1 */}
        <h1 className="sr-only">Secure Authentication Verification</h1>

        {/* SEO Description */}
        <p className="sr-only">
          Verifying user authentication and checking access permissions for
          protected Krishna Event ERP pages.
        </p>

        {/* Loader */}
        <div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
          role="status"
          aria-live="polite"
          aria-label="Loading authentication status"
        />

        {/* Screen Reader Text */}
        <span className="sr-only">Please wait while we verify your secure session.</span>
      </section>
    );
  }

  // Authenticated
  return <>{children}</>;
};

export default AuthGuard;
