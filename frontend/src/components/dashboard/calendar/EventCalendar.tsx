'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, RefreshCw, Eye, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/utils/cn';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { crmService } from '@/lib/services/crm.services';
import { bookingService } from '@/lib/services/booking.services';
import { useTranslation } from 'react-i18next';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: 'Booking' | 'Lead' | 'Site Visit';
  status: string;
  location: string;
  time: string;
  originalId: string;
}

const getEventColorClasses = (type: 'Booking' | 'Lead' | 'Site Visit', status: string) => {
  const normStatus = status?.toLowerCase();

  // Cancelled / Lost status -> Danger Rose
  if (normStatus === 'cancelled' || normStatus === 'lost') {
    return 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400';
  }

  // Completed / Confirmed / Booked status -> Success Green
  if (normStatus === 'completed' || normStatus === 'confirmed' || normStatus === 'booked') {
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400';
  }

  // Scheduled / Planning / Contacted / Quotation / Site Visit -> Warning Amber
  if (
    normStatus === 'scheduled' || 
    normStatus === 'planning' || 
    normStatus === 'contacted' || 
    normStatus === 'quotation' || 
    normStatus === 'site visit'
  ) {
    return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400';
  }

  // Draft / New / Ongoing / InProgress -> Info Blue
  if (
    normStatus === 'draft' || 
    normStatus === 'new' || 
    normStatus === 'ongoing' || 
    normStatus === 'inprogress'
  ) {
    return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400';
  }

  // Default color based on type
  if (type === 'Booking') {
    return 'bg-primary/10 border-primary/20 text-primary-700 dark:bg-primary/20 dark:border-primary/30 dark:text-primary-400';
  } else if (type === 'Lead') {
    return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400';
  } else {
    return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400';
  }
};

const getEventDotColor = (type: 'Booking' | 'Lead' | 'Site Visit', status: string) => {
  const normStatus = status?.toLowerCase();
  if (normStatus === 'cancelled' || normStatus === 'lost') return 'bg-rose-500';
  if (normStatus === 'completed' || normStatus === 'confirmed' || normStatus === 'booked') return 'bg-emerald-500';
  if (normStatus === 'scheduled' || normStatus === 'planning' || normStatus === 'contacted' || normStatus === 'quotation' || normStatus === 'site visit') return 'bg-amber-500';
  if (normStatus === 'draft' || normStatus === 'new' || normStatus === 'ongoing' || normStatus === 'inprogress') return 'bg-blue-500';
  if (type === 'Booking') return 'bg-primary';
  if (type === 'Lead') return 'bg-amber-500';
  return 'bg-blue-500';
};

const getEventBorderAccent = (type: 'Booking' | 'Lead' | 'Site Visit', status: string) => {
  const normStatus = status?.toLowerCase();
  if (normStatus === 'cancelled' || normStatus === 'lost') return 'border-l-rose-500';
  if (normStatus === 'completed' || normStatus === 'confirmed' || normStatus === 'booked') return 'border-l-emerald-500';
  if (normStatus === 'scheduled' || normStatus === 'planning' || normStatus === 'contacted' || normStatus === 'quotation' || normStatus === 'site visit') return 'border-l-amber-500';
  if (normStatus === 'draft' || normStatus === 'new' || normStatus === 'ongoing' || normStatus === 'inprogress') return 'border-l-blue-500';
  if (type === 'Booking') return 'border-l-primary';
  if (type === 'Lead') return 'border-l-amber-500';
  return 'border-l-blue-500';
};

const MAX_VISIBLE_EVENTS = 2;

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function EventCalendar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [bookingsData, leadsData, siteVisitsData] = await Promise.all([
        bookingService.getBookings({ limit: 100 }),
        crmService.getLeads(),
        crmService.getSiteVisits()
      ]);

      const mappedBookings: CalendarEvent[] = (bookingsData?.data || []).map((b: any) => ({
        id: `booking-${b._id}`,
        title: b.eventTitle || 'Event Booking',
        date: b.eventStartDate ? new Date(b.eventStartDate) : new Date(),
        endDate: b.eventEndDate ? new Date(b.eventEndDate) : undefined,
        type: 'Booking',
        status: b.status,
        location: b.venueAddress || 'No Venue Specified',
        time: b.eventStartDate 
          ? new Date(b.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) 
          : '—',
        originalId: b._id
      }));

      const mappedLeads: CalendarEvent[] = (leadsData || []).map((l: any) => ({
        id: `lead-${l._id}`,
        title: `${l.customerName || 'Lead'} - Lead (${l.eventType || 'Event'})`,
        date: l.eventDate ? new Date(l.eventDate) : new Date(l.createdAt || Date.now()),
        type: 'Lead',
        status: l.stage,
        location: 'CRM Lead Info',
        time: '—',
        originalId: l._id
      }));

      const mappedSiteVisits: CalendarEvent[] = (siteVisitsData || []).map((s: any) => ({
        id: `sitevisit-${s._id}`,
        title: `${s.customerName || 'Customer'} - Site Visit`,
        date: s.visitDate ? new Date(s.visitDate) : new Date(s.createdAt || Date.now()),
        type: 'Site Visit',
        status: s.status,
        location: s.venueAddress || 'No Venue Specified',
        time: s.visitDate 
          ? new Date(s.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) 
          : '—',
        originalId: s._id
      }));

      setEvents([...mappedBookings, ...mappedLeads, ...mappedSiteVisits]);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    const isWeekendSlot = i === 0 || i === 6;
    days.push(
      <div key={`empty-${i}`} className={cn(
        "min-h-[70px] sm:min-h-[110px] border-b border-r border-border/20 p-1 sm:p-2",
        isWeekendSlot 
          ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.01]"
          : "bg-card"
      )}>
        <div className="w-full h-full opacity-[0.02] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_11px)]"></div>
      </div>
    );
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Find events for this day
    const dayEvents = events.filter(e => e.date.toDateString() === dateObj.toDateString());
    const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
    const remainingCount = dayEvents.length - MAX_VISIBLE_EVENTS;

    days.push(
      <div 
        key={d} 
        onClick={() => setSelectedDate(dateObj)}
        className={cn(
          "min-h-[70px] sm:min-h-[110px] border-b border-r border-border/20 p-1.5 sm:p-2.5 transition-all duration-300 cursor-pointer group relative",
          "hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:z-10 hover:bg-gradient-to-br hover:from-primary/[0.02] hover:to-primary/[0.06] dark:hover:shadow-black/50",
          isSelected 
            ? "bg-primary/[0.03] ring-2 ring-inset ring-primary/40 shadow-inner shadow-primary/10" 
            : isWeekend 
              ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.01]"
              : "bg-card",
          dayEvents.length > 0 && !isSelected && "border-t-2 border-t-primary/10"
        )}
      >
        <div className="flex justify-between items-start mb-0.5 sm:mb-1.5">
          <span className={cn(
            "text-[11px] sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all duration-200",
            isToday ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-primary/30 ring-offset-1 ring-offset-background" : 
            isSelected ? "bg-foreground text-background shadow-md shadow-foreground/20" : 
            isWeekend ? "text-amber-600/80 dark:text-amber-500/70 group-hover:bg-amber-500/10" :
            "text-foreground group-hover:bg-muted"
          )}>
            {d}
          </span>
          {dayEvents.length > 0 && (
            <span className={cn(
              "text-[9px] sm:text-[10px] font-extrabold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full transition-all duration-200",
              isSelected 
                ? "bg-primary text-on-primary shadow-sm shadow-primary/30" 
                : "bg-primary/15 text-primary border border-primary/25 shadow-sm"
            )}>
              {dayEvents.length}
            </span>
          )}
        </div>
        
        <div className="space-y-0.5 sm:space-y-1.5 mt-0.5 sm:mt-1">
          {visibleEvents.map(event => (
            <div 
              key={event.id}
              className="flex items-center gap-1 sm:gap-1.5 group/chip px-1 sm:px-1.5 py-0.5 rounded-full bg-foreground/[0.02] hover:bg-foreground/[0.06] hover:shadow-sm border border-transparent hover:border-border/30 backdrop-blur-sm transition-all"
            >
              <span className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ring-1 ring-background shadow-[0_0_4px_rgba(0,0,0,0.1)]", getEventDotColor(event.type, event.status))}></span>
              <span className="text-[8px] sm:text-[10px] leading-tight truncate font-bold text-foreground/80 group-hover/chip:text-foreground transition-colors">
                {event.title}
              </span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="inline-flex items-center text-[8px] sm:text-[9px] font-bold text-primary/90 bg-primary/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-primary/20 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer shadow-sm mt-0.5">
              +{remainingCount} More
            </div>
          )}
        </div>
      </div>
    );
  }

  // Selected date events for the side panel
  const selectedDayEvents = selectedDate ? events.filter(e => e.date.toDateString() === selectedDate.toDateString()) : [];

  if (loading) {
    return (
      <div className="flex flex-col h-full space-y-6">
        <PageHeader 
          title={t('calendar.title')} 
          description={t('calendar.description')}
        />
        <Card className="flex-1 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
                <CalendarIcon className="w-8 h-8 text-primary/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary/30 animate-ping"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-3 w-40 bg-muted rounded-full animate-pulse"></div>
              <div className="h-2 w-28 bg-muted/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading events...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader 
        title={t('calendar.title')} 
        description={t('calendar.description')}
      />
      <div className="flex flex-wrap items-center gap-y-2 gap-x-3 sm:gap-x-6 bg-background/80 border border-border/50 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold shadow-md backdrop-blur-md">
        <span className="text-muted-foreground/70 uppercase tracking-[0.15em] text-[8px] sm:text-[9px] font-extrabold mr-0.5">{t('calendar.legend')}</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 sm:ring-[3px] ring-emerald-500/20"></span>
          <span className="text-foreground/70">{t('calendar.confirmed')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 ring-2 sm:ring-[3px] ring-amber-500/20"></span>
          <span className="text-foreground/70">{t('calendar.scheduled')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 ring-2 sm:ring-[3px] ring-rose-500/20"></span>
          <span className="text-foreground/70">Cancelled</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 ring-2 sm:ring-[3px] ring-blue-500/20"></span>
          <span className="text-foreground/70">Draft</span>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 w-full">
        {/* Calendar Grid */}
        <Card className="flex-1 min-w-0 overflow-hidden flex flex-col shadow-md shadow-black/[0.04] border-border/60">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-transparent pb-3 pt-3 sm:pb-4 sm:pt-4 px-3 sm:px-6 flex flex-row justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm shadow-primary/10 shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-xl font-extrabold font-display tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  {MONTHS[month]} {year}
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium mt-0.5 hidden sm:block">Manage your event schedule</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Button variant="outline" size="sm" onClick={handleToday} className="font-bold text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-3 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all">
                Today
              </Button>
              <div className="flex items-center bg-card border border-border/60 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-sm hover:shadow-md transition-shadow">
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg hover:bg-muted/80 transition-colors" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <div className="w-px h-3 sm:h-4 bg-border/50 mx-0.5"></div>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg hover:bg-muted/80 transition-colors" onClick={handleNextMonth}>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <div className="flex-1 flex flex-col">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/20">
              {DAYS_OF_WEEK.map((day, i) => (
                <div key={day} className={cn(
                  "py-2 sm:py-3 text-center text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.12em]",
                  i === 0 || i === 6 
                    ? "text-rose-500/70 bg-rose-50/30 dark:bg-rose-950/10 dark:text-rose-400/60" 
                    : "text-muted-foreground/70"
                )}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1">
              {days}
            </div>
          </div>
        </Card>

        {/* Side Panel for Selected Day */}
        <div className="w-full xl:w-80 2xl:w-96 flex flex-col gap-4">
          <Card className="shadow-2xl shadow-black/[0.08] border-border/50 overflow-hidden ring-1 ring-white/10 relative backdrop-blur-xl">
            {/* Gradient accent bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-amber-400"></div>
            <CardHeader className="border-b border-border/40 bg-gradient-to-b from-primary/[0.05] to-transparent pb-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Date'}
                  </h3>
                </div>
                {selectedDayEvents.length > 0 && (
                  <span className="text-[11px] font-extrabold bg-gradient-to-br from-primary to-primary/90 text-primary-foreground px-3 py-1.5 rounded-full shadow-lg shadow-primary/30 ring-1 ring-white/20">
                    {selectedDayEvents.length} Event{selectedDayEvents.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDayEvents.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-background via-muted/50 to-muted/80 flex items-center justify-center mb-6 shadow-xl ring-1 ring-border/50 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                      <CalendarIcon className="w-10 h-10 text-muted-foreground/50 group-hover:text-primary/60 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/40 shadow-lg shadow-primary/40 animate-bounce delay-150"></div>
                  </div>
                  <p className="font-extrabold text-base text-foreground/80 mt-2">No events scheduled</p>
                  <p className="text-xs mt-2 text-muted-foreground/60 font-semibold max-w-[200px] mx-auto">Select a highlighted day on the calendar to view its details.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[calc(100vh-340px)] overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80 transition-colors pr-2">
                  {selectedDayEvents.map((event, idx) => (
                    <div key={event.id} className={cn(
                      "shrink-0 p-4 flex flex-col gap-4 border-l-[4px] transition-all duration-300 bg-background rounded-r-xl shadow-sm border border-l-0 border-border/40 hover:shadow-md hover:-translate-y-0.5 group/card relative overflow-hidden",
                      getEventBorderAccent(event.type, event.status)
                    )}>
                      {/* Hover subtle glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start gap-2 relative z-10">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-[14px] leading-snug truncate text-foreground tracking-tight">{event.title}</h4>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full mt-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
                            getEventColorClasses(event.type, event.status)
                          )}>
                            <span className={cn("w-2 h-2 rounded-full", getEventDotColor(event.type, event.status))}></span>
                            <span className="uppercase tracking-wider">{event.type}</span>
                          </span>
                        </div>
                        <div className="shrink-0 scale-95 origin-top-right">
                          <StatusBadge status={event.status} />
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5 bg-muted/30 rounded-xl px-3.5 py-3 border border-border/30 relative z-10">
                        <div className="flex items-center text-xs text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                          <Clock className="w-4 h-4 mr-2.5 shrink-0 text-primary/60" />
                          <span className="font-semibold">{event.time}</span>
                        </div>
                        <div className="flex items-start text-xs text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                          <MapPin className="w-4 h-4 mr-2.5 shrink-0 text-primary/60 mt-0.5" />
                          <span className="leading-snug font-semibold">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-1 relative z-10">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-[11px] h-9 font-bold bg-background hover:bg-muted/80 transition-all gap-1.5 border-border/60 hover:border-border shadow-sm" 
                          onClick={() => {
                            const route = event.type === 'Booking' 
                              ? `/operations/bookings/${event.originalId}` 
                              : event.type === 'Lead'
                              ? `/crm/leads/${event.originalId}`
                              : `/crm/site-visits/${event.originalId}`;
                            router.push(route);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <ActionGuard permission={event.type === 'Booking' ? 'bookings.update' : 'crm.update'}>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="flex-1 text-[11px] h-9 font-bold transition-all shadow-md hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-[1px] gap-1.5"
                            onClick={() => {
                              const route = event.type === 'Booking' 
                                ? `/operations/bookings/${event.originalId}/edit` 
                                : event.type === 'Lead'
                                ? `/crm/leads/${event.originalId}/edit`
                                : `/crm/site-visits/${event.originalId}/edit`;
                              router.push(route);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </ActionGuard>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
