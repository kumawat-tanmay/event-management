'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthSplitLayout({ children, title, subtitle }: AuthSplitLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Branding & Visuals (Hidden on smaller screens) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
          alt="Premium Event Setup"
          fill
          className="object-cover opacity-40 hover:opacity-50 transition-opacity duration-1000"
          priority
        />
        
        {/* Top Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
        
        {/* Logo/Brand Section */}
        <div className="relative z-10 p-12 mt-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black text-xl tracking-tighter">KT</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Krishna Tent & Events</h1>
          </div>
        </div>

        {/* Bottom Content Section */}
        <div className="relative z-10 p-12 mb-12 max-w-lg">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            {t('auth.brandingTitle', 'Manage your events with Elegance.')}
          </h2>
          <p className="text-lg text-zinc-300 font-medium">
            {t('auth.brandingSub', 'The ultimate ERP solution to streamline bookings, inventory, logistics, and executions.')}
          </p>
        </div>
      </div>

      {/* Right Panel: Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-background relative">
        {/* Subtle background decoration for the form side */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo (Visible only on mobile/tablet) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-black text-xl tracking-tighter">KT</span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Krishna Tent & Events</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">
              {title === 'Welcome back' || !title ? t('auth.signIn') : title}
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              {subtitle && subtitle.includes('credentials') ? t('auth.signInSub') : (subtitle || t('auth.signInSub'))}
            </p>
          </div>
          
          <div className="bg-card border border-border shadow-2xl shadow-black/5 rounded-2xl p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

