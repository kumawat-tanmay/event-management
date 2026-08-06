import React, { Suspense } from 'react';
import { Metadata } from 'next';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Reset Password',
  description: 'Set a new secure password for your Krishna Tent & Events ERP account.',
  url: '/reset-password',
});

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
