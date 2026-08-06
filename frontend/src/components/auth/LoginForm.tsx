'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/lib/services/auth.services';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getLoginSchema } from '@/utils/validations';
import { useTranslation } from 'react-i18next';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // ─── Email/Password Login ─────────────────────────────
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const validation = getLoginSchema(t).safeParse({ email, password });
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Invalid email or password.';
      setError(msg);
      setIsLoading(false);
      return;
    }

    const toastId = toast.loading(t('auth.loggingIn'));

    try {
      const response = await authService.login(email.trim().toLowerCase(), password);

      if (response.success) {
        login(response.data, response.data.token);
        toast.success(t('auth.signInSuccess', 'Welcome back!'), { id: toastId });
        router.push('/');
      } else {
        const msg = response.message || 'Invalid email or password.';
        setError(msg);
        toast.error(msg, { id: toastId });
      }
    } catch (err: any) {
      const backendMsg = err.response?.data?.message;
      const status = err.response?.status;
      const msg = backendMsg || (status === 401 ? 'Invalid email or password' : 'An error occurred during login.');
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google OAuth Login ───────────────────────────────
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) return;
      setIsGoogleLoading(true);
      const toastId = toast.loading(t('auth.verifyingGoogle', 'Verifying Google account...'));
      try {
        const response = await authService.googleLogin(tokenResponse.access_token);
        if (response.success) {
          login(response.data, response.data.token);
          toast.success(t('auth.signInSuccess', 'Welcome back!'), { id: toastId });
          router.push('/');
        } else {
          toast.error(response.message || 'Google login failed', { id: toastId });
        }
      } catch (error: any) {
        const msg = error.response?.data?.message || 'Google login failed. Please try again.';
        toast.error(msg, { id: toastId });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => toast.error('Google Sign In Failed'),
  });

  return (
    <div className="space-y-5 w-full">
      {error && (
        <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Google Sign In Button ── */}
      <button
        type="button"
        onClick={() => loginWithGoogle()}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted transition-all font-semibold text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 3.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {isGoogleLoading ? t('auth.connecting', 'Connecting...') : t('auth.signInGoogle')}
      </button>

      {/* ── Divider ── */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          {t('auth.orWithEmail', 'or with email')}
        </span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* ── Email / Password Form ── */}
      <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('auth.email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder', 'Enter your email address')}
              className="pl-10 h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              className="pl-10 pr-10 h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            {t('auth.rememberMe')}
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold group mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('auth.loggingIn')}
            </>
          ) : (
            <>
              {t('auth.signIn')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
