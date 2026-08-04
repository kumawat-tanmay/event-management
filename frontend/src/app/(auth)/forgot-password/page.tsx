import React from 'react';
import { Metadata } from 'next';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password - Krishna Tent & Events ERP',
  description: 'Reset your password for Krishna Tent & Events ERP.',
};

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
