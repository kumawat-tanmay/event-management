'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth.services';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { getResetPasswordSchema } from '@/utils/validations';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Key,
} from 'lucide-react';

export default function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ─── Client-side validation ────────────────────────────
  const validate = () => {
    if (!token) return t('auth.invalidResetLink', 'Reset token is missing. Please request a new link.');
    const result = getResetPasswordSchema(t).safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      return result.error.issues[0]?.message || 'Invalid password input.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    const toastId = toast.loading(t('auth.resettingPassword', 'Resetting your password...'));

    try {
      const response = await authService.resetPassword(newPassword, token!);
      if (response.success) {
        toast.success(t('auth.passwordResetSuccessMsg', 'Password reset successfully!'), { id: toastId });
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      } else {
        const msg = response.message || t('auth.resetFail', 'Failed to reset password.');
        setError(msg);
        toast.error(msg, { id: toastId });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t('auth.resetFailLink', 'Failed to reset password. The link may have expired.');
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success State ─────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">{t('auth.passwordReset', 'Password Reset!')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('auth.passwordResetSuccess', 'Your password has been updated successfully.')}
            <br />
            {t('auth.redirectingToLogin', 'Redirecting to login...')}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.goToLogin', 'Go to Login')}
        </Link>
      </div>
    );
  }

  // ─── Invalid Token State ───────────────────────────────
  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive font-medium">
            {t('auth.invalidResetLink', 'Invalid or missing reset link. Please request a new password reset.')}
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.requestNewResetLink', 'Request New Reset Link')}
        </Link>
      </div>
    );
  }

  // ─── Form State ────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Reset password form">

      {error && (
        <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
          {t('auth.newPassword', 'New Password')}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <Input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          {t('auth.passwordRequirements', 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number')}
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          {t('auth.confirmPassword', 'Confirm Password')}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold mt-2"
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('auth.resetting', 'Resetting...')}
          </>
        ) : (
          <>
            <Key className="mr-2 h-5 w-5" />
            {t('auth.resetPasswordTitle', 'Reset Password')}
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.backToLogin', 'Back to Login')}
        </Link>
      </div>
    </form>
  );
}
