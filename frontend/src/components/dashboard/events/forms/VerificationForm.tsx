'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, MapPin, Clock, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';

export function VerificationForm() {
  const router = useRouter();

  // Dummy Data for Site Verification
  const verificationTasks = [
    {
      id: 'EVT-2026-089',
      name: 'Aditi & Rahul Royal Wedding',
      venue: 'Fairmont Hotel, Jaipur',
      eventStart: 'Today, 10:00 PM',
      manager: 'Vikram Singh',
      status: 'Setup Pending',
      readiness: 75
    },
    {
      id: 'EVT-2026-092',
      name: 'TechCorp Annual Summit',
      venue: 'JECC, Jaipur',
      eventStart: 'Tomorrow, 09:00 AM',
      manager: 'Rahul Mehta',
      status: 'Verified',
      readiness: 100
    },
    {
      id: 'EVT-2026-095',
      name: 'Ramesh 50th Birthday',
      venue: 'Rambagh Palace, Jaipur',
      eventStart: 'Today, 08:00 PM',
      manager: 'Sneha Gupta',
      status: 'Critical',
      readiness: 40
    }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Site Verification</h2>
          <p className="text-sm font-medium text-muted-foreground">Verify site readiness and ensure client sign-off before the event starts.</p>
        </div>
      </div>

      {/* KPI Stats - Vendor Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <StatsCard
          title="Pending Verifications"
          value={2}
          icon={ShieldCheck}
          subtitle="Action Needed"
          colorTheme="primary"
        />
        <StatsCard
          title="Critical / Delayed"
          value={1}
          icon={AlertTriangle}
          subtitle="Critical"
          colorTheme="error"
        />
        <StatsCard
          title="Fully Verified Today"
          value={1}
          icon={CheckCircle2}
          subtitle="Excellent"
          colorTheme="success"
        />
      </div>

      {/* Grid Layout for Verification Cards */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Active Sites</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verificationTasks.map((task) => (
            <Card key={task.id} className="border-border shadow-sm flex flex-col hover:border-primary/50 transition-colors bg-card">
              <CardHeader className="border-b border-border bg-muted/10 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{task.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${task.status === 'Verified' ? 'bg-success/10 text-success' :
                    task.status === 'Critical' ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'
                    }`}>
                    {task.status}
                  </span>
                </div>
                <CardTitle className="text-base font-bold leading-tight cursor-pointer hover:underline" onClick={() => router.push(`/events/${task.id}`)}>
                  {task.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{task.venue}</p>
                    <p className="text-xs text-muted-foreground">Venue Location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{task.eventStart}</p>
                    <p className="text-xs text-muted-foreground">Event Starts In</p>
                  </div>
                </div>

                {/* Readiness Progress */}
                <div className="pt-2">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Setup Readiness</p>
                    <p className="text-sm font-bold">{task.readiness}%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${task.readiness === 100 ? 'bg-success' : task.readiness < 50 ? 'bg-error' : 'bg-warning'}`}
                      style={{ width: `${task.readiness}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border p-4 bg-muted/5">
                <Button
                  variant={task.status === 'Verified' ? 'outline' : 'primary'}
                  className="w-full"
                  onClick={() => router.push(`/events/verification/${task.id}`)}
                >
                  {task.status === 'Verified' ? 'View Report' : 'Verify Setup'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
