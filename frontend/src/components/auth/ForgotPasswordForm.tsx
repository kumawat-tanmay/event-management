'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/lib/services/auth.services';
import toast from 'react-hot-toast';
import { emailSchema } from '@/utils/validations';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Please enter a valid email address';
      setError(msg);
      setIsLoading(false);
      return;
    }

    const normalizedEmail = validation.data;

    const toastId = toast.loading('Sending reset link...');
    try {
      const response = await authService.forgotPassword(normalizedEmail);
      if (response.success) {
        toast.success('Reset link sent! Check your email.', { id: toastId });
        setSuccess(true);
      } else {
        const msg = response.message || 'Failed to send reset link.';
        setError(msg);
        toast.error(msg, { id: toastId });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success State ────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We've sent a password reset link to{' '}
            <span className="font-semibold text-foreground">{email}</span>.
            <br />
            Please check your inbox and spam folder.
          </p>
        </div>
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-left">
          <p className="text-xs text-muted-foreground">
            Didn't receive an email?{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary font-semibold hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    );
  }

  // ─── Form State ───────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Forgot password form">
      {error && (
        <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="Enter your registered email"
            className="pl-10 h-12"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        <p className="text-xs text-muted-foreground px-1">
          We'll send a password reset link to this email.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold group"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </form>
  );
}
