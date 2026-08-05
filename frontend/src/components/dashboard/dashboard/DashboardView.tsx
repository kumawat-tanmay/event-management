'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { StatsCard, StatsCardSkeleton } from '@/components/common/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  CalendarDays, Truck, RotateCcw, Wallet, Box, MapPin, Users, Bookmark,
  TrendingUp, ChevronRight,
  Calendar, ChevronDown, ChevronLeft, LineChart, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import useSWR from 'swr';
import { dashboardService, DashboardStats } from '@/lib/services/dashboard.services';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// ponytail: register GSAP plugin once
gsap.registerPlugin(ScrollTrigger);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatNumber = (val: number) => {
  if (val >= 1000) {
    return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const VIBRANT_BAR_GRADIENTS = [
  'from-amber-600 via-amber-500 to-yellow-400 border-amber-400/40 shadow-amber-500/20',
  'from-emerald-600 via-emerald-500 to-teal-400 border-emerald-400/40 shadow-emerald-500/20',
  'from-blue-600 via-indigo-500 to-cyan-400 border-blue-400/40 shadow-blue-500/20',
  'from-purple-600 via-violet-500 to-indigo-400 border-purple-400/40 shadow-purple-500/20',
  'from-rose-600 via-pink-500 to-amber-400 border-rose-400/40 shadow-rose-500/20',
  'from-cyan-600 via-teal-500 to-emerald-400 border-cyan-400/40 shadow-cyan-500/20',
  'from-orange-600 via-amber-500 to-yellow-400 border-orange-400/40 shadow-orange-500/20',
];

const BUSINESS_QUOTES = [
  "Bringing visions to life, one event at a time. ✨",
  "Every great event starts with a great plan. 📝",
  "Success is in the details of the execution. 🎯",
  "Turning moments into unforgettable memories. 🌟",
  "Great things in business are never done by one person. 🤝",
  "The secret to a successful event is preparation. 🚀",
  "Creating seamless experiences from start to finish. 🎪"
];

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/60 rounded-xl ${className}`} />;
}

// ─── Smooth Bezier Spline Generator ───────────────────────────────────────────
function getBezierPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return { line: '', area: '' };
  if (points.length === 1) return { line: `M ${points[0].x},${points[0].y}`, area: '' };

  let line = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    line += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const area = `${line} L ${lastPt.x.toFixed(2)},50 L ${firstPt.x.toFixed(2)},50 Z`;

  return { line, area };
}

// ─── Animated Counter (pure CSS + JS, no framer) ──────────────────────────────
function AnimatedNumber({
  value,
  formatType = 'number'
}: {
  value: number;
  formatType?: 'number' | 'currency' | 'compact'
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (value === 0) {
      if (formatType === 'currency') ref.current.textContent = formatCurrency(0);
      else if (formatType === 'compact') ref.current.textContent = '0';
      else ref.current.textContent = '0';
      return;
    }
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (!ref.current) return;
        const currentVal = Math.round(obj.val);
        if (formatType === 'currency') {
          ref.current.textContent = formatCurrency(currentVal);
        } else if (formatType === 'compact') {
          ref.current.textContent = formatNumber(currentVal);
        } else {
          ref.current.textContent = currentVal.toLocaleString('en-IN');
        }
      }
    });
  }, [value, formatType]);

  const initialText = formatType === 'currency' ? formatCurrency(0) : '0';
  return <span ref={ref}>{initialText}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: statsData, isLoading } = useSWR<DashboardStats>('/dashboard/stats', () => dashboardService.getStats());
  const dashRef = useRef<HTMLDivElement>(null);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [growthPeriod, setGrowthPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // ponytail: quote rotation
  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * BUSINESS_QUOTES.length));
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % BUSINESS_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ponytail: Lenis smooth scroll + GSAP ScrollTrigger — both target the actual <main> scroll container
  useEffect(() => {
    const dashEl = dashRef.current;
    if (!dashEl) return;

    // The scroll container is the <main class="overflow-y-auto"> parent
    const scroller = dashEl.closest('main') as HTMLElement;
    if (!scroller) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Init Lenis on the actual scroll container
    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.firstElementChild as HTMLElement || scroller,
      duration: prefersReducedMotion ? 0 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    // Connect Lenis → GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    const rafCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    // Tell GSAP ScrollTrigger to use the same scroller
    ScrollTrigger.defaults({ scroller });

    // GSAP scroll-triggered entrance animations + inner card animations
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gsap-row').forEach((row) => {
        const cards = row.querySelectorAll('.gsap-card');

        if (prefersReducedMotion) {
          gsap.set(cards, { opacity: 1, y: 0 });

          const donutSegs = row.querySelectorAll('.gsap-donut-seg');
          donutSegs.forEach(seg => {
            const circ = 2 * Math.PI * 40;
            const targetLen = parseFloat(seg.getAttribute('data-seglen') || '0');
            const offset = parseFloat(seg.getAttribute('data-offset') || '0');
            seg.setAttribute('stroke-dasharray', `${targetLen} ${circ}`);
            seg.setAttribute('stroke-dashoffset', String(offset));
          });

          const donutCenter = row.querySelector('.gsap-donut-center');
          if (donutCenter) gsap.set(donutCenter, { scale: 1 });

          const revLine = row.querySelector('.gsap-rev-line');
          const revArea = row.querySelector('.gsap-rev-area');
          if (revLine) gsap.set(revLine, { strokeDashoffset: 0 });
          if (revArea) gsap.set(revArea, { opacity: 1 });

          const flowSteps = row.querySelectorAll('.gsap-flow-step');
          if (flowSteps.length) gsap.set(flowSteps, { scale: 1, y: 0 });

          const flowLine = row.querySelector('.gsap-flow-line');
          if (flowLine) gsap.set(flowLine, { x: '0%' });

          const eventItems = row.querySelectorAll('.gsap-event-item');
          if (eventItems.length) gsap.set(eventItems, { opacity: 1, x: 0 });

          const bookingRows = row.querySelectorAll('.gsap-booking-row');
          if (bookingRows.length) gsap.set(bookingRows, { opacity: 1, x: 0 });

          const tlDots = row.querySelectorAll('.gsap-tl-dot');
          if (tlDots.length) gsap.set(tlDots, { scale: 1 });

          const tlItems = row.querySelectorAll('.gsap-tl-item');
          if (tlItems.length) gsap.set(tlItems, { opacity: 1, y: 0 });

          return;
        }

        gsap.set(cards, { opacity: 0, y: 30 });

        ScrollTrigger.create({
          trigger: row,
          scroller,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              stagger: 0.08,
              onComplete: () => {
                // Inner card animations fire after the card itself is visible

                // Donut chart segments — draw in (grow from zero length)
                const donutSegs = row.querySelectorAll('.gsap-donut-seg');
                if (donutSegs.length) {
                  donutSegs.forEach((seg, i) => {
                    const circ = 2 * Math.PI * 40; // circumference
                    const targetLen = parseFloat(seg.getAttribute('data-seglen') || '0');
                    const offset = parseFloat(seg.getAttribute('data-offset') || '0');

                    // Set initial state: 0 length
                    seg.setAttribute('stroke-dasharray', `0 ${circ}`);
                    seg.setAttribute('stroke-dashoffset', String(offset));

                    const proxy = { len: 0 };
                    gsap.to(proxy, {
                      len: targetLen,
                      duration: 1.2,
                      ease: 'power3.out',
                      delay: 0.1 + i * 0.15, // stagger
                      onUpdate: () => {
                        seg.setAttribute('stroke-dasharray', `${proxy.len} ${circ}`);
                      }
                    });
                  });
                }

                // Donut center — scale pop
                const donutCenter = row.querySelector('.gsap-donut-center');
                if (donutCenter) {
                  gsap.fromTo(donutCenter, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.4 });
                }

                // Revenue chart path — draw line
                const revLine = row.querySelector('.gsap-rev-line');
                const revArea = row.querySelector('.gsap-rev-area');
                if (revLine) {
                  const len = (revLine as SVGPathElement).getTotalLength?.() || 200;
                  gsap.set(revLine, { strokeDasharray: len, strokeDashoffset: len });
                  gsap.to(revLine, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' });
                }
                if (revArea) {
                  gsap.fromTo(revArea, { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.5 });
                }

                // Material flow steps — spring bounce in
                const flowSteps = row.querySelectorAll('.gsap-flow-step');
                if (flowSteps.length) {
                  gsap.fromTo(flowSteps,
                    { scale: 0, y: 20 },
                    { scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.12 }
                  );
                }

                // Flow connecting line
                const flowLine = row.querySelector('.gsap-flow-line');
                if (flowLine) {
                  gsap.fromTo(flowLine, { x: '-100%' }, { x: '0%', duration: 1.2, ease: 'power2.inOut' });
                }

                // Upcoming events — slide from right
                const eventItems = row.querySelectorAll('.gsap-event-item');
                if (eventItems.length) {
                  gsap.fromTo(eventItems,
                    { opacity: 0, x: 20 },
                    { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.1 }
                  );
                }

                // Booking table rows — slide from left
                const bookingRows = row.querySelectorAll('.gsap-booking-row');
                if (bookingRows.length) {
                  gsap.fromTo(bookingRows,
                    { opacity: 0, x: -20 },
                    { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 }
                  );
                }

                // Timeline dots — scale pop
                const tlDots = row.querySelectorAll('.gsap-tl-dot');
                if (tlDots.length) {
                  gsap.fromTo(tlDots,
                    { scale: 0 },
                    { scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.15 }
                  );
                }

                // Timeline items — fade + slide
                const tlItems = row.querySelectorAll('.gsap-tl-item');
                if (tlItems.length) {
                  gsap.fromTo(tlItems,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.12 }
                  );
                }
              }
            });
          }
        });
      });
    }, dashRef);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove(rafCallback);
      ScrollTrigger.defaults({ scroller: undefined });
    };
  }, [isLoading]); // re-run when data loads so new cards get picked up

  const stats = statsData?.summary;

  const activeGrowthData = useMemo(() => {
    const ga = statsData?.growthAnalysis;
    if (!ga) return [];
    if (Array.isArray(ga)) return ga;
    if (growthPeriod === 'weekly') return ga.weekly || [];
    if (growthPeriod === 'daily') return ga.daily || [];
    return ga.monthly || [];
  }, [statsData, growthPeriod]);

  const recentBookings = statsData?.recentBookings || [];
  const warehouseSummary = statsData?.warehouseSummary || [];
  const inventoryBreakdown = statsData?.inventoryBreakdown || [];
  const materialFlow = statsData?.materialFlow;
  const pendingDispatches = statsData?.pendingDispatches || [];
  const pendingReturns = statsData?.pendingReturns || [];
  const upcomingEvents = statsData?.upcomingEvents || [];
  const dispatchTimeline = statsData?.dispatchTimeline || [];

  // ─── Today's Date ─────────────────────────────────────────────────────────
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  // ─── Revenue Chart Data ───────────────────────────────────────────────────
  const totalRevenue = useMemo(() => activeGrowthData.reduce((s, g) => s + g.revenue, 0), [activeGrowthData]);
  const totalExpenses = useMemo(() => activeGrowthData.reduce((s, g) => s + g.expenses, 0), [activeGrowthData]);
  const netProfit = totalRevenue - totalExpenses;

  const revenueChangePercent = useMemo(() => {
    if (activeGrowthData.length < 2) return '0';
    const current = activeGrowthData[activeGrowthData.length - 1]?.revenue || 0;
    const previous = activeGrowthData[activeGrowthData.length - 2]?.revenue || 1;
    return ((current - previous) / previous * 100).toFixed(1);
  }, [activeGrowthData]);

  const revenueSvgPath = useMemo(() => {
    if (activeGrowthData.length === 0) return { area: '', line: '', points: [] };
    const maxRev = Math.max(...activeGrowthData.map(g => g.revenue), 1);
    const pts = activeGrowthData.map((g, i) => {
      const x = (i / (activeGrowthData.length - 1 || 1)) * 100;
      const y = 42 - (g.revenue / maxRev) * 32;
      return { x, y, revenue: g.revenue, expenses: g.expenses || 0, date: g.date };
    });
    const spline = getBezierPath(pts);
    return { area: spline.area, line: spline.line, points: pts };
  }, [activeGrowthData]);

  // ─── Inventory Donut ──────────────────────────────────────────────────────
  const inventoryTotal = useMemo(() => inventoryBreakdown.reduce((s, i) => s + i.value, 0), [inventoryBreakdown]);

  // ─── Warehouse Summary Totals ─────────────────────────────────────────────
  const warehouseTotals = useMemo(() => {
    return warehouseSummary.reduce(
      (acc, wh) => ({
        available: acc.available + wh.available,
        reserved: acc.reserved + wh.reserved,
        atSite: acc.atSite + wh.atSite,
        damaged: acc.damaged + wh.damaged,
      }),
      { available: 0, reserved: 0, atSite: 0, damaged: 0 }
    );
  }, [warehouseSummary]);

  // ─── Mini Calendar ────────────────────────────────────────────────────────
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date());

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; hasEvent: boolean; isToday: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, hasEvent: false, isToday: false });
    }

    const now = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const hasEvent = upcomingEvents.some(e => {
        const evDate = new Date(e.date);
        return evDate.getFullYear() === year && evDate.getMonth() === month && evDate.getDate() === d;
      });
      const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
      days.push({ day: d, isCurrentMonth: true, hasEvent, isToday });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, isCurrentMonth: false, hasEvent: false, isToday: false });
    }

    return days;
  }, [calendarMonth, upcomingEvents]);

  const calendarMonthLabel = calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // ─── Timeline colors mapping ──────────────────────────────────────────────
  const timelineColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div ref={dashRef} className="space-y-6 pb-12">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD OVERVIEW BANNER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="bg-gradient-to-r from-[#8a5a32] to-[#b37542] dark:from-[#734a29] dark:to-[#8a5a32] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 mb-6 md:mb-0 flex flex-col">
            <span className="text-white/80 text-sm sm:text-base font-medium mb-1">
              {t('dashboard.welcomeBack')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black font-display text-white mb-2 tracking-tight flex items-center">
              {user?.name || 'User'}
              <span className="inline-block ml-3 animate-wave" style={{ transformOrigin: "70% 70%" }}>👋</span>
            </h1>
            <div className="h-6 mt-1">
              <p
                key={quoteIndex}
                className="text-white/85 text-sm sm:text-base font-medium max-w-lg italic tracking-wide animate-fadeIn"
              >
                &quot;{BUSINESS_QUOTES[quoteIndex]}&quot;
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-between gap-3 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium transition-colors backdrop-blur-sm border border-white/10 shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="opacity-90" />
                  <span className="text-sm">{todayStr}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 1: 7 KPI Cards */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="gsap-row grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.todaysEvents')} value={<AnimatedNumber value={stats?.todaysEvents ?? 0} />} icon={CalendarDays} colorTheme="warning" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.todaysDispatch')} value={<AnimatedNumber value={stats?.todaysDispatches ?? 0} />} subtitle="Active" icon={Truck} colorTheme="blue" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.todaysReturns')} value={<AnimatedNumber value={stats?.todaysReturns ?? 0} />} subtitle="Action Needed" icon={RotateCcw} colorTheme="orange" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.pendingPayments')} value={<AnimatedNumber value={stats?.pendingPayments ?? 0} formatType="currency" />} subtitle="Critical" icon={Wallet} colorTheme="error" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.availableStock')} value={<AnimatedNumber value={stats?.availableStock ?? 0} formatType="compact" />} icon={Box} colorTheme="success" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.materialAtSite')} value={<AnimatedNumber value={stats?.materialAtSite ?? 0} formatType="compact" />} icon={MapPin} colorTheme="yellow" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title={t('dashboard.staffPresent')} value={<AnimatedNumber value={parseInt(String(stats?.staffPresent ?? 0), 10) || 0} />} icon={Users} colorTheme="purple" />}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 2: Inventory & Revenue */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="gsap-row grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Inventory Status (Donut) */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            <CardHeader className="pb-6">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.inventoryStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {isLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="flex flex-row items-center justify-between h-full">
                  <div className="w-1/2 flex justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-full max-w-[220px] h-auto transform -rotate-90 drop-shadow-sm">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="15" opacity="0.2" />
                      {inventoryTotal > 0 && (() => {
                        const circumference = 2 * Math.PI * 40;
                        let offset = 0;
                        return inventoryBreakdown.map((seg) => {
                          const segLen = (seg.value / inventoryTotal) * circumference;
                          const el = (
                            <circle
                              key={seg.label}
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="15"
                              strokeDasharray={`${segLen} ${circumference}`}
                              strokeDashoffset={-offset}
                              data-offset={-offset}
                              data-seglen={segLen}
                              className="gsap-donut-seg cursor-pointer transition-[stroke-width,opacity] duration-300 hover:stroke-[17] hover:opacity-80"
                            />
                          );
                          offset += segLen;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="gsap-donut-center absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-muted-foreground font-semibold">{t('dashboard.totalItems')}</span>
                      <span className="text-3xl font-black font-display text-foreground"><AnimatedNumber value={inventoryTotal} /></span>
                    </div>
                  </div>

                  <div className="w-1/2 grid grid-cols-2 content-center gap-y-8 gap-x-4 text-sm font-medium border-l border-border/50 pl-8 h-full py-4">
                    {inventoryBreakdown.map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-foreground text-[15px]">{item.label}</span>
                        </div>
                        <span className="text-muted-foreground ml-6 text-xs">
                          {item.value} Items ({inventoryTotal > 0 ? Math.round((item.value / inventoryTotal) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Overview */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.revenueOverview')}</h3>
                {isLoading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-2xl font-bold font-display"><AnimatedNumber value={totalRevenue} formatType="currency" /></p>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <TrendingUp size={13} className="mr-1" /> {Number(revenueChangePercent) >= 0 ? '+' : ''}{revenueChangePercent}% <span className="text-muted-foreground ml-1 font-normal">{t('dashboard.vsPrev')}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Controls: Chart Type Selector + Timeframe Selector */}
              <div className="flex items-center gap-2">
                {/* Chart Type Toggle (Line vs Bar) */}
                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                  <button
                    onClick={() => setChartType('line')}
                    title="Smooth Line Chart"
                    className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <LineChart size={15} />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    title="Bar Chart View"
                    className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <BarChart3 size={15} />
                  </button>
                </div>

                {/* Timeframe Selector Pills */}
                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs font-medium">
                  {(['monthly', 'weekly', 'daily'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setGrowthPeriod(period)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${growthPeriod === period
                        ? 'bg-amber-600 text-white font-bold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                      {t(`dashboard.${period}`)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              {isLoading ? <Skeleton className="h-56 w-full" /> : (
                chartType === 'line' ? (
                  /* Line Chart Mode - Sleek Spline Line */
                  <div className="h-56 mt-4 w-full relative flex items-end">
                    <div className="absolute inset-0 border-b border-border pointer-events-none" />
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="60%" stopColor="#d97706" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenueLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="50%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                      </defs>
                      {revenueSvgPath.area && (
                        <>
                          <path d={revenueSvgPath.area} fill="url(#colorRevenueArea)" className="transition-all duration-500" />
                          <path d={revenueSvgPath.line} fill="none" stroke="url(#colorRevenueLine)" strokeWidth="2.5" className="transition-all duration-500" />
                        </>
                      )}
                    </svg>

                    {/* Precise Native SVG Circle Markers overlayed at 100% exact Y line position */}
                    {revenueSvgPath.points.map((pt, idx) => (
                      <div
                        key={idx}
                        style={{ left: `${pt.x}%`, top: `${(pt.y / 50) * 100}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-card border-2 border-amber-500 shadow-md shadow-amber-500/40 cursor-pointer transition-all duration-200 hover:scale-150 hover:bg-amber-500 hover:border-white z-20 group"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/40 text-white text-[11px] font-medium py-2 px-3 rounded-xl whitespace-nowrap shadow-2xl pointer-events-none z-30 flex flex-col gap-0.5">
                          <div className="flex justify-between items-center text-[9px] text-amber-400 font-bold uppercase tracking-wider border-b border-border/40 pb-1">
                            <span>{pt.date}</span>
                          </div>
                          <p className="text-emerald-400 font-bold mt-0.5">Rev: {formatCurrency(pt.revenue)}</p>
                          {pt.expenses > 0 && <p className="text-red-400 font-medium">Exp: {formatCurrency(pt.expenses)}</p>}
                        </div>
                      </div>
                    ))}

                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                      {activeGrowthData.map((g) => (
                        <span key={g.date} className="text-[9px] font-semibold text-muted-foreground">{g.date}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Bar Chart Mode - Executive Warm Gold Palette */
                  <div className="h-56 mt-4 w-full relative flex items-end justify-between px-3 gap-2 border-b border-border">
                    {activeGrowthData.map((g, idx) => {
                      const maxRev = Math.max(...activeGrowthData.map(item => item.revenue), 1);
                      const heightPercent = Math.max(10, (g.revenue / maxRev) * 85);
                      return (
                        <div key={g.date || `bar-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                          {/* Tooltip on Bar Hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full mb-2 bg-zinc-900/95 backdrop-blur-md border border-amber-500/40 text-white text-[11px] font-medium py-2 px-3 rounded-xl whitespace-nowrap shadow-2xl pointer-events-none z-30 flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-[9px] text-amber-400 font-bold uppercase tracking-wider border-b border-border/40 pb-1">
                              <span>{g.date}</span>
                            </div>
                            <p className="text-emerald-400 font-bold mt-0.5">Rev: {formatCurrency(g.revenue)}</p>
                            {g.expenses > 0 && <p className="text-red-400 font-medium">Exp: {formatCurrency(g.expenses)}</p>}
                          </div>

                          {/* Executive Warm Amber / Brand Gold Vertical Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[24px] bg-gradient-to-t from-amber-700 via-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-300 rounded-t-md border-t border-x border-amber-300/40 transition-all duration-300 shadow-md group-hover:shadow-amber-500/30 group-hover:scale-y-[1.03] origin-bottom"
                          />

                          {/* X-axis label */}
                          <span className="text-[9px] font-semibold text-muted-foreground mt-2 truncate w-full text-center">
                            {g.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 3: Inventory Flow & Calendar */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="gsap-row grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Material Movement Flow */}
        <div className="gsap-card xl:col-span-7">
          <Card className="h-full relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-8">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.materialFlow')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="flex justify-between items-center px-2 md:px-6 mt-4 relative">
                  <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0 overflow-hidden">
                    <div className="gsap-flow-line w-full h-full bg-primary/30" />
                  </div>
                  {[
                    { label: t('dashboard.available'), val: materialFlow?.available ?? 0, icon: Box, color: 'bg-emerald-500 text-white border-emerald-500' },
                    { label: t('dashboard.reserved'), val: materialFlow?.reserved ?? 0, icon: Bookmark, color: 'bg-blue-500 text-white border-blue-500' },
                    { label: t('dashboard.loading'), val: materialFlow?.loading ?? 0, icon: Truck, color: 'bg-orange-500 text-white border-orange-500' },
                    { label: t('dashboard.dispatch'), val: materialFlow?.dispatched ?? 0, icon: Truck, color: 'bg-primary text-white border-primary' },
                    { label: t('dashboard.atSite'), val: materialFlow?.atSite ?? 0, icon: MapPin, color: 'bg-yellow-500 text-white border-yellow-500' },
                    { label: t('dashboard.return'), val: materialFlow?.returned ?? 0, icon: RotateCcw, color: 'bg-red-500 text-white border-red-500' },
                  ].map((step, idx) => (
                    <div
                      key={step.label || `flow-${idx}`}
                      className="gsap-flow-step relative z-10 flex flex-col items-center group cursor-default"
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 border-card shadow-sm transition-transform group-hover:scale-110 ${step.color}`}>
                        <step.icon size={14} className="md:w-4 md:h-4" />
                      </div>
                      <div className="text-center mt-2 bg-card px-1">
                        <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground">{step.label}</p>
                        <p className="text-[11px] md:text-[12px] font-bold text-foreground mt-0.5"><AnimatedNumber value={step.val} formatType="compact" /></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Calendar Widget */}
        <div className="gsap-card xl:col-span-5">
          <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.eventCalendar')}</CardTitle>
              <Link href="/calendar" className="text-[11px] text-muted-foreground hover:text-primary">{t('dashboard.viewAll')}</Link>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1 border border-border">
                  <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-[12px] font-bold px-2">{calendarMonthLabel}</span>
                  <button onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-1 gap-4">
                {/* Mini Calendar */}
                <div className="w-1/2">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-[9px] font-bold text-muted-foreground uppercase">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                    {calendarDays.map((cd, idx) => (
                      <div
                        key={`cal-day-${idx}-${cd.day}`}
                        className={`py-1 rounded cursor-pointer transition-all duration-200 relative hover:scale-110 ${!cd.isCurrentMonth ? 'text-muted-foreground/40' :
                          cd.isToday ? 'bg-[#8a5a32] text-white shadow-sm font-bold' :
                            'hover:bg-muted'
                          }`}
                      >
                        {cd.day}
                        {cd.hasEvent && cd.isCurrentMonth && !cd.isToday && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events List */}
                <div className="w-1/2 flex flex-col space-y-3 overflow-y-auto pr-1">
                  {isLoading ? <Skeleton className="h-full w-full" /> : upcomingEvents.length > 0 ? upcomingEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={event._id || `ev-${idx}`}
                      className="gsap-event-item group cursor-pointer p-1 rounded-md hover:bg-muted/30 transition-all duration-200 hover:translate-x-[-3px]"
                    >
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1 group-hover:text-primary transition-colors">{formatDate(event.date)}</p>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[12px] font-bold text-foreground leading-tight">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{event.venue || 'Venue TBD'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 px-1.5 py-0.5 rounded">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No upcoming events</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 4: Bookings & Timeline */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="gsap-row grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Bookings (col-span-2) */}
        <div className="gsap-card lg:col-span-2">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.recentBookings')}</CardTitle>
              <Link href="/operations/bookings" className="text-[11px] text-muted-foreground hover:text-primary">{t('dashboard.viewAll')}</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-48 w-full" /> : recentBookings.length > 0 ? (
                <div className="overflow-x-auto w-full rounded-2xl border border-border/60">
                  <table className="w-full text-sm text-left border-collapse min-w-[600px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-border/60">
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Booking ID</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Customer</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Event Date</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Location</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2] text-right">Amount</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b, idx) => (
                        <tr key={b._id || `booking-${idx}`} className="gsap-booking-row transition-all duration-200 hover:bg-[#FAF6F0] dark:hover:bg-[#2d221a] border-b border-border/40 last:border-b-0">
                          <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-400">{b.bookingId}</td>
                          <td className="px-5 py-3 font-semibold text-foreground">{b.customerName}</td>
                          <td className="px-5 py-3 text-muted-foreground">{formatDateFull(b.date)}</td>
                          <td className="px-5 py-3 text-muted-foreground">{b.venueAddress ? b.venueAddress.split(',')[0] : '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-foreground">{formatCurrency(b.grandTotal)}</td>
                          <td className="px-5 py-3 text-right"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">{t('dashboard.noBookings')}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dispatch Timeline */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.dispatchTimeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border z-0" />
                  {dispatchTimeline.map((tl, idx) => (
                    <div
                      key={tl.stage || `tl-${idx}`}
                      className="gsap-tl-item relative z-10 cursor-pointer hover:translate-x-1 transition-transform duration-200"
                    >
                      <div className={`gsap-tl-dot absolute -left-6 top-0 w-5 h-5 rounded-full ${timelineColorMap[tl.color] || 'bg-zinc-400'} border-4 border-card flex items-center justify-center`} />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[13px] font-bold text-foreground leading-tight">
                            {tl.stage} <span className={`text-[10px] font-medium ml-1 ${tl.color === 'emerald' ? 'text-emerald-500' : tl.color === 'blue' ? 'text-blue-500' : 'text-yellow-500'}`}>{tl.count} Dispatches</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Today&apos;s {tl.stage.toLowerCase()} dispatches</p>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">Today</span>
                      </div>
                    </div>
                  ))}
                  {dispatchTimeline.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">{t('dashboard.noDispatchesToday')}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 5: Pending Dispatch & Returns */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="gsap-row grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Dispatch */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.pendingDispatch')}</CardTitle>
              <Link href="/logistics/dispatches" className="text-[11px] text-muted-foreground hover:text-primary">{t('dashboard.viewAll')}</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-32 w-full" /> : pendingDispatches.length > 0 ? (
                <div className="overflow-x-auto w-full rounded-2xl border border-border/60">
                  <table className="w-full text-sm text-left border-collapse min-w-[500px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-border/60">
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Dispatch ID</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Event</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Date</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDispatches.map((d, idx) => (
                        <tr key={d._id || `disp-${idx}`} className="transition-all duration-200 hover:bg-[#FAF6F0] dark:hover:bg-[#2d221a] border-b border-border/40 last:border-b-0">
                          <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-400">{d.dispatchId}</td>
                          <td className="px-5 py-3 font-semibold text-foreground">{d.eventTitle}</td>
                          <td className="px-5 py-3 text-muted-foreground">{formatDate(d.date)}</td>
                          <td className="px-5 py-3 text-right"><StatusBadge status={d.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">{t('dashboard.noPendingDispatches')}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Returns */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">{t('dashboard.pendingReturns')}</CardTitle>
              <Link href="/operations/returns" className="text-[11px] text-muted-foreground hover:text-primary">{t('dashboard.viewAll')}</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-32 w-full" /> : pendingReturns.length > 0 ? (
                <div className="overflow-x-auto w-full rounded-2xl border border-border/60">
                  <table className="w-full text-sm text-left border-collapse min-w-[500px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-border/60">
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Dispatch ID</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Event</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2]">Date</th>
                        <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-[#5C3A21] dark:text-[#E2C7B2] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReturns.map((d, idx) => (
                        <tr key={d._id || `ret-${idx}`} className="transition-all duration-200 hover:bg-[#FAF6F0] dark:hover:bg-[#2d221a] border-b border-border/40 last:border-b-0">
                          <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-400">{d.dispatchId}</td>
                          <td className="px-5 py-3 font-semibold text-foreground">{d.eventTitle}</td>
                          <td className="px-5 py-3 text-muted-foreground">{formatDate(d.date)}</td>
                          <td className="px-5 py-3 text-right"><StatusBadge status={d.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">{t('dashboard.noPendingReturns')}</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
