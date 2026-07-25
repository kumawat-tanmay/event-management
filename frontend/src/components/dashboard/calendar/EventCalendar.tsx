'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/utils/cn';

// Dummy events based on UI_DESIGN_SYSTEM.md (Sharma Wedding, Gupta Wedding, Meena Reception)
const DUMMY_EVENTS = [
  {
    id: '1',
    title: 'Sharma Wedding',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
    type: 'Wedding',
    status: 'Upcoming',
    location: 'Grand Taj Resort',
    time: '18:00',
    guests: 500,
  },
  {
    id: '2',
    title: 'Gupta Wedding',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 22),
    type: 'Wedding',
    status: 'Planned',
    location: 'Royal Gardens',
    time: '19:00',
    guests: 800,
  },
  {
    id: '3',
    title: 'Meena Reception',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
    type: 'Reception',
    status: 'Completed',
    location: 'City Hall',
    time: '20:00',
    guests: 300,
  },
  {
    id: '4',
    title: 'Corporate Meetup',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 28),
    type: 'Corporate',
    status: 'Ongoing',
    location: 'ITC Rajputana',
    time: '10:00',
    guests: 150,
  }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function EventCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

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
    days.push(<div key={`empty-${i}`} className="min-h-[100px] sm:min-h-[120px] bg-muted/20 border-b border-r border-border p-2"></div>);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
    
    // Find events for this day
    const dayEvents = DUMMY_EVENTS.filter(e => e.date.toDateString() === dateObj.toDateString());

    days.push(
      <div 
        key={d} 
        onClick={() => setSelectedDate(dateObj)}
        className={cn(
          "min-h-[100px] sm:min-h-[120px] border-b border-r border-border p-2 transition-colors cursor-pointer group hover:bg-muted/50",
          isSelected ? "bg-primary/5" : "bg-card",
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
            isToday ? "bg-primary text-primary-foreground" : 
            isSelected ? "bg-foreground text-background" : "text-foreground"
          )}>
            {d}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              {dayEvents.length}
            </span>
          )}
        </div>
        
        <div className="space-y-1 overflow-y-auto max-h-[70px] sm:max-h-[85px] no-scrollbar">
          {dayEvents.map(event => (
            <div 
              key={event.id}
              className={cn(
                "text-xs px-2 py-1 rounded-md border truncate font-medium",
                event.status === 'Completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" :
                event.status === 'Ongoing' ? "bg-blue-500/10 border-blue-500/20 text-blue-700" :
                event.status === 'Planned' ? "bg-amber-500/10 border-amber-500/20 text-amber-700" :
                "bg-primary/10 border-primary/20 text-primary-700"
              )}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Selected date events for the side panel
  const selectedDayEvents = selectedDate ? DUMMY_EVENTS.filter(e => e.date.toDateString() === selectedDate.toDateString()) : [];

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader 
        title="Event Calendar" 
        description="Track and manage all your upcoming weddings, corporate events, and bookings."
        action={<Button variant="primary" onClick={() => router.push('/calendar/new')}>+ Schedule Event</Button>}
      />
      <div className="flex flex-col xl:flex-row gap-6 w-full">
      {/* Calendar Grid */}
      <Card className="flex-1 overflow-hidden flex flex-col shadow-sm border-border">
        <CardHeader className="border-b border-border bg-muted/30 pb-4 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold font-display">
                {MONTHS[month]} {year}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage your event schedule</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} className="font-semibold">
              Today
            </Button>
            <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1"></div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <div className="flex-1 flex flex-col bg-border">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-[1px]">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="bg-muted/50 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-[1px] bg-border flex-1">
            {days}
          </div>
        </div>
      </Card>

      {/* Side Panel for Selected Day */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Date'}
              </h3>
              {selectedDayEvents.length > 0 && (
                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedDayEvents.length} Events
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {selectedDayEvents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <CalendarIcon className="w-12 h-12 mb-3 text-muted" />
                <p>No events scheduled for this day.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/calendar/new')}>
                  + Schedule Event
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                {selectedDayEvents.map((event, idx) => (
                  <div key={event.id} className={cn(
                    "p-4 flex flex-col gap-3",
                    idx !== selectedDayEvents.length - 1 && "border-b border-border"
                  )}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base">{event.title}</h4>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{event.type}</p>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2 shrink-0 text-primary/70" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2 shrink-0 text-primary/70" />
                        <span>{event.guests} Guests</span>
                      </div>
                      <div className="flex items-start text-sm text-muted-foreground col-span-2 mt-1">
                        <MapPin className="w-4 h-4 mr-2 shrink-0 text-primary/70 mt-0.5" />
                        <span className="leading-snug">{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => router.push(`/calendar/${event.id}`)}>View Details</Button>
                      <Button variant="primary" size="sm" className="flex-1 text-xs h-8">Manage Ops</Button>
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
