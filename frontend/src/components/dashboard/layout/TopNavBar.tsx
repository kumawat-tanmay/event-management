'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Menu,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Bell,
  Calendar,
  Plus,
  Truck,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getBackendHostUrl } from '@/lib/apiClient';
import { useTranslation } from 'react-i18next';

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
}

interface TopNavBarProps {
  onMenuClick?: () => void;
}

export function TopNavBar({ onMenuClick }: TopNavBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getProfilePhoto = () => {
    const rawPhoto = user?.avatar || user?.profilePhoto || user?.picture;
    if (!rawPhoto) return null;
    if (typeof rawPhoto === 'string' && rawPhoto.startsWith('http')) return rawPhoto;
    const cleanPath = String(rawPhoto).replace(/\\/g, '/');
    const prefix = cleanPath.startsWith('/') ? '' : '/';
    return `${getBackendHostUrl()}${prefix}${cleanPath}`;
  };

  const profilePhoto = getProfilePhoto();
  
  const userRoleRaw = user?.role;
  const userRoleStr = (typeof userRoleRaw === 'object' && userRoleRaw !== null && 'name' in userRoleRaw) 
    ? (userRoleRaw as {name: string}).name 
    : (typeof userRoleRaw === 'string' ? userRoleRaw : 'User');

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 print:hidden">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">

        {/* Animated New Booking Button (Visible on mobile too) */}
        <div className="flex items-center ml-1 sm:ml-2">
          <motion.div
            className="relative inline-block group"
            whileHover="hover"
            initial="initial"
          >
            {/* Magnetic Energy Ripples */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary opacity-40 pointer-events-none blur-[4px]"
              style={{ zIndex: 0 }}
              variants={{
                initial: { scale: 1, opacity: 0 },
                hover: {
                  scale: [1, 1.35],
                  opacity: [0.8, 0],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }
                }
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary opacity-30 pointer-events-none blur-[4px]"
              style={{ zIndex: 0 }}
              variants={{
                initial: { scale: 1, opacity: 0 },
                hover: {
                  scale: [1, 1.5],
                  opacity: [0.6, 0],
                  transition: {
                    duration: 1.5,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }
                }
              }}
            />

            <motion.div
              style={{ position: 'relative', zIndex: 1 }}
              whileHover={{
                scale: 1.06,
                boxShadow: "0 20px 25px -5px rgba(138, 90, 50, 0.4), 0 10px 10px -5px rgba(138, 90, 50, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl"
            >
              <Link href="/bookings/new">
                <button
                  className="relative overflow-hidden rounded-xl bg-primary text-white font-extrabold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-primary/30 cursor-pointer border border-white/10 px-3 py-2 sm:px-4 sm:py-2.5"
                >
                  {/* Infinite looping glass highlight sweep from left to right */}
                  <motion.div
                    className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    style={{ zIndex: 0 }}
                    animate={{
                      x: ["-180%", "280%"]
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 2,
                      ease: "easeInOut",
                      repeatDelay: 1.2
                    }}
                  />

                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>{t('navbar.newBooking')}</span>
                  </span>
                </button>
              </Link>
            </motion.div>
          </motion.div>

          <Link href="/dispatches" className="ml-1 sm:ml-2">
            <button className="flex items-center bg-card hover:bg-muted border border-border text-foreground px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-semibold sm:font-medium transition-colors shadow-sm h-full">
              <Truck size={16} className="sm:mr-1.5" />
              <span className="hidden sm:inline">{t('navbar.dispatch')}</span>
            </button>
          </Link>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border hidden sm:block mx-1"></div>

        {/* Action Icons */}
        <div className="hidden sm:flex items-center space-x-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title={t('navbar.toggleTheme')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() => {
            const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
            i18n.changeLanguage(nextLang);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground mr-1"
          title={t('navbar.selectLanguage')}
        >
          <span className={cn(i18n.language === 'en' ? 'text-primary font-extrabold' : 'text-muted-foreground')}>EN</span>
          <span className="text-muted-foreground/30 font-light">|</span>
          <span className={cn(i18n.language === 'hi' ? 'text-primary font-extrabold' : 'text-muted-foreground')}>हिंदी</span>
        </button>

        <button className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba292e] rounded-full border-2 border-card"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative ml-1 sm:ml-2" ref={dropdownRef}>
          <button className="flex items-center gap-2 group focus:outline-none" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[11px] font-bold overflow-hidden border border-border shadow-sm transition-transform group-hover:scale-105">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.name || user?.fullname)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-foreground leading-tight truncate max-w-[100px]">
                {user?.name || user?.fullname || 'Guest User'}
              </div>
              <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                {userRoleStr}
              </div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-300 ml-1 hidden sm:block",
              isDropdownOpen ? "rotate-180" : ""
            )} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-60 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl py-2 overflow-hidden z-50 shadow-primary/10"
              >
                <div className="px-4 py-3 border-b border-border/50 mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('navbar.signedInAs')}</p>
                  <p className="text-sm font-bold text-foreground truncate mt-0.5">{user?.email || 'N/A'}</p>
                </div>

                <div className="px-2 space-y-0.5">
                  <Link
                    href="/settings/users/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group/item"
                  >
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover/item:bg-primary/20 group-hover/item:text-primary transition-colors">
                      <User size={16} />
                    </div>
                    {t('navbar.myProfile')}
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group/item"
                  >
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover/item:bg-primary/20 group-hover/item:text-primary transition-colors">
                      <Settings size={16} />
                    </div>
                    {t('navbar.settings')}
                  </Link>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 px-2 mb-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-[#ba292e] hover:bg-[#ba292e]/10 rounded-xl transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#ba292e]/10 text-[#ba292e]">
                      <LogOut size={16} />
                    </div>
                    {t('navbar.signOut')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
