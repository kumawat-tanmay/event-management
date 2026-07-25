'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

/**
 * 🌐 Google Authentication Provider
 * Wraps the application to enable Google Social Login.
 */
export default function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('Google Client ID is missing in environment variables. Google Login will be disabled.');
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
