import React from 'react';
import { Metadata } from 'next';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Forgot Password',
  description: 'Reset your password for Krishna Tent & Events ERP.',
  url: '/forgot-password',
});

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
