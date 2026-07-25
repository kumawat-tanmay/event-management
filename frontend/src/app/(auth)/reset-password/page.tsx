import React, { Suspense } from 'react';
import { Metadata } from 'next';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password - Krishna Tent & Events ERP',
  description: 'Set a new password for your Krishna Tent & Events ERP account.',
};

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout
      title="Set New Password"
      subtitle="Create a strong new password for your account."
    >
      {/* Suspense required because ResetPasswordForm uses useSearchParams() */}
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
