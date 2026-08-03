'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { StatsCard, StatsCardSkeleton } from '@/components/common/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  CalendarDays, Truck, RotateCcw, Wallet, Box, MapPin, Users, Bookmark,
  TrendingUp, ChevronRight,
  Calendar, ChevronDown, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
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

// ─── Animated Counter (pure CSS + JS, no framer) ──────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || value === 0) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString();
      }
    });
  }, [value]);
  return <span ref={ref}>0</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardView() {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useSWR<DashboardStats>('/dashboard/stats', () => dashboardService.getStats());
  const dashRef = useRef<HTMLDivElement>(null);

  const [quoteIndex, setQuoteIndex] = useState(0);

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

    // Init Lenis on the actual scroll container
    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.firstElementChild as HTMLElement || scroller,
      duration: 1.2,
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
  const growthAnalysis = statsData?.growthAnalysis || [];
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
  const totalRevenue = useMemo(() => growthAnalysis.reduce((s, g) => s + g.revenue, 0), [growthAnalysis]);
  const totalExpenses = useMemo(() => growthAnalysis.reduce((s, g) => s + g.expenses, 0), [growthAnalysis]);
  const netProfit = totalRevenue - totalExpenses;

  const revenueChangePercent = useMemo(() => {
    if (growthAnalysis.length < 2) return 0;
    const current = growthAnalysis[growthAnalysis.length - 1]?.revenue || 0;
    const previous = growthAnalysis[growthAnalysis.length - 2]?.revenue || 1;
    return ((current - previous) / previous * 100).toFixed(1);
  }, [growthAnalysis]);

  const revenueSvgPath = useMemo(() => {
    if (growthAnalysis.length === 0) return { area: '', line: '' };
    const maxRev = Math.max(...growthAnalysis.map(g => g.revenue), 1);
    const points = growthAnalysis.map((g, i) => {
      const x = (i / (growthAnalysis.length - 1 || 1)) * 100;
      const y = 50 - (g.revenue / maxRev) * 45;
      return `${x},${y}`;
    });
    const line = `M${points.join(' L')}`;
    const area = `${line} L100,50 L0,50 Z`;
    return { area, line };
  }, [growthAnalysis]);

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
              Welcome back,
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
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Today's Events" value={String(stats?.todaysEvents ?? 0)} icon={CalendarDays} colorTheme="warning" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Today's Dispatch" value={String(stats?.todaysDispatches ?? 0)} subtitle="Active" icon={Truck} colorTheme="blue" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Today's Returns" value={String(stats?.todaysReturns ?? 0)} subtitle="Action Needed" icon={RotateCcw} colorTheme="orange" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Pending Payments" value={formatCurrency(stats?.pendingPayments ?? 0)} subtitle="Critical" icon={Wallet} colorTheme="error" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Available Stock" value={String(stats?.availableStock ?? 0)} icon={Box} colorTheme="success" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Material At Site" value={String(stats?.materialAtSite ?? 0)} icon={MapPin} colorTheme="yellow" />}
        </div>
        <div className="gsap-card">
          {isLoading ? <StatsCardSkeleton /> : <StatsCard title="Staff Present" value={stats?.staffPresent ?? '0'} icon={Users} colorTheme="purple" />}
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
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Inventory Status</CardTitle>
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
                        return inventoryBreakdown.map((seg, idx) => {
                          const segLen = (seg.value / inventoryTotal) * circumference;
                          const el = (
                            <circle
                              key={idx}
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="15"
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
                      <span className="text-xs text-muted-foreground font-semibold">Total Items</span>
                      <span className="text-3xl font-black font-display text-foreground"><AnimatedNumber value={inventoryTotal} /></span>
                    </div>
                  </div>

                  <div className="w-1/2 grid grid-cols-2 content-center gap-y-8 gap-x-4 text-sm font-medium border-l border-border/50 pl-8 h-full py-4">
                    {inventoryBreakdown.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
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
            <CardHeader className="flex flex-row justify-between items-start pb-4 space-y-0">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Revenue Overview</h3>
                {isLoading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                  <>
                    <p className="text-2xl font-bold font-display mt-2">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                      <TrendingUp size={14} className="mr-1" /> {Number(revenueChangePercent) >= 0 ? '+' : ''}{revenueChangePercent}% <span className="text-muted-foreground ml-1">vs Last Month</span>
                    </p>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              {isLoading ? <Skeleton className="h-56 w-full" /> : (
                <div className="h-56 mt-4 w-full relative flex items-end">
                  <div className="absolute inset-0 border-b border-border pointer-events-none" />
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8a5a32" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8a5a32" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {revenueSvgPath.area && (
                      <>
                        <path d={revenueSvgPath.area} fill="url(#colorRevenue)" className="gsap-rev-area" />
                        <path d={revenueSvgPath.line} fill="none" stroke="#8a5a32" strokeWidth="1" className="gsap-rev-line" />
                      </>
                    )}
                  </svg>
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                    {growthAnalysis.map((g, i) => (
                      <span key={i} className="text-[8px] text-muted-foreground">{g.date.split(' ')[0]}</span>
                    ))}
                  </div>
                </div>
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
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Material Movement Flow</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="flex justify-between items-center px-2 md:px-6 mt-4 relative">
                  <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0 overflow-hidden">
                    <div className="gsap-flow-line w-full h-full bg-primary/30" />
                  </div>
                  {[
                    { label: 'Available', val: formatNumber(materialFlow?.available ?? 0), icon: Box, color: 'bg-emerald-500 text-white border-emerald-500' },
                    { label: 'Reserved', val: formatNumber(materialFlow?.reserved ?? 0), icon: Bookmark, color: 'bg-blue-500 text-white border-blue-500' },
                    { label: 'Loading', val: formatNumber(materialFlow?.loading ?? 0), icon: Truck, color: 'bg-orange-500 text-white border-orange-500' },
                    { label: 'Dispatch', val: formatNumber(materialFlow?.dispatched ?? 0), icon: Truck, color: 'bg-primary text-white border-primary' },
                    { label: 'At Site', val: formatNumber(materialFlow?.atSite ?? 0), icon: MapPin, color: 'bg-yellow-500 text-white border-yellow-500' },
                    { label: 'Return', val: formatNumber(materialFlow?.returned ?? 0), icon: RotateCcw, color: 'bg-red-500 text-white border-red-500' },
                  ].map((step, idx) => (
                    <div 
                      key={idx} 
                      className="gsap-flow-step relative z-10 flex flex-col items-center group cursor-default"
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 border-card shadow-sm transition-transform group-hover:scale-110 ${step.color}`}>
                        <step.icon size={14} className="md:w-4 md:h-4" />
                      </div>
                      <div className="text-center mt-2 bg-card px-1">
                        <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground">{step.label}</p>
                        <p className="text-[11px] md:text-[12px] font-bold text-foreground mt-0.5">{step.val}</p>
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
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Event Calendar</CardTitle>
              <Link href="/calendar" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
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
                        key={idx}
                        className={`py-1 rounded cursor-pointer transition-all duration-200 relative hover:scale-110 ${
                          !cd.isCurrentMonth ? 'text-muted-foreground/40' :
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
                      key={event._id}
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
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Recent Bookings</CardTitle>
              <Link href="/operations/bookings" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-48 w-full" /> : recentBookings.length > 0 ? (
                <Table className="whitespace-nowrap">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((b) => (
                      <TableRow key={b._id} className="gsap-booking-row hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-primary">{b.bookingId}</TableCell>
                        <TableCell className="font-semibold">{b.customerName}</TableCell>
                        <TableCell>{formatDateFull(b.date)}</TableCell>
                        <TableCell>{b.venueAddress ? b.venueAddress.split(',')[0] : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(b.grandTotal)}</TableCell>
                        <TableCell className="text-right"><StatusBadge status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No bookings yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dispatch Timeline */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Dispatch Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border z-0" />
                  {dispatchTimeline.map((tl, idx) => (
                    <div 
                      key={idx} 
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
                    <div className="text-sm text-muted-foreground text-center py-6">No dispatches today</div>
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
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Pending Dispatch</CardTitle>
              <Link href="/logistics/dispatches" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-32 w-full" /> : pendingDispatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch ID</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDispatches.map((d) => (
                      <TableRow key={d._id}>
                        <TableCell>{d.dispatchId}</TableCell>
                        <TableCell>{d.eventTitle}</TableCell>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No pending dispatches</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Returns */}
        <div className="gsap-card">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Pending Returns</CardTitle>
              <Link href="/operations/returns" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading ? <Skeleton className="h-32 w-full" /> : pendingReturns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch ID</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReturns.map((d) => (
                      <TableRow key={d._id}>
                        <TableCell>{d.dispatchId}</TableCell>
                        <TableCell>{d.eventTitle}</TableCell>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No pending returns</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
