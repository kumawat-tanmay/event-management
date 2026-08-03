import React from 'react';
import { Metadata } from 'next';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import LoginForm from '@/components/auth/LoginForm';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Sign In',
  description: 'Sign in to access your Krishna Tent & Events ERP dashboard and manage event bookings, inventory, and finances.',
  url: '/login',
});

export default function LoginPage() {
  return (
    <AuthSplitLayout 
      title="Welcome back" 
      subtitle="Please enter your credentials to access your dashboard."
    >
      <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </React.Suspense>
    </AuthSplitLayout>
  );
}
