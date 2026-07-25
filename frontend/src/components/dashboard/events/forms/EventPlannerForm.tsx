'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CalendarDays, ClipboardList, Clock, 
  CheckCircle2, Users, Save, Plus
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';

export function EventPlannerForm() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState('TIMELINE');

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Event Planning & Timeline" 
            description={`Manage timeline and department checklists for ${eventId || 'Event'}`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="primary" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Wedding
                </span>
                <StatusBadge status="In Progress" />
              </div>
              <CardTitle className="text-xl font-bold leading-tight">Aditi & Rahul Royal Wedding</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">15 Oct 2026 to 17 Oct 2026</p>
                  <p className="text-xs text-muted-foreground">Event Schedule</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Vikram Singh</p>
                  <p className="text-xs text-muted-foreground">Assigned Manager</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Planner Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <div className="border-b border-border flex items-center overflow-x-auto p-2 shrink-0 no-scrollbar">
              {['TIMELINE', 'DEPARTMENT CHECKLISTS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === tab
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {tab === 'TIMELINE' && <Clock className="w-4 h-4" />}
                  {tab === 'DEPARTMENT CHECKLISTS' && <ClipboardList className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>
            
            <CardContent className="pt-6 flex-1">
              {activeTab === 'TIMELINE' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-foreground">Function Schedule</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Function
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { title: 'Haldi Ceremony', date: '15 Oct 2026', time: '10:00 AM' },
                      { title: 'Sangeet', date: '15 Oct 2026', time: '08:00 PM' },
                      { title: 'Main Wedding', date: '16 Oct 2026', time: '07:00 PM' }
                    ].map((func, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-bold text-foreground text-base mb-1">{func.title}</p>
                          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {func.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {func.time}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Edit</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'DEPARTMENT CHECKLISTS' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-foreground">Assigned Departments</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Decoration & Florals', status: 'Planned' },
                      { name: 'Lighting & Sound', status: 'Pending' },
                      { name: 'Catering & Dining', status: 'Planned' },
                      { name: 'Hospitality & Rooms', status: 'Pending' }
                    ].map((dept, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-xl flex items-center justify-between bg-card">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            dept.status === 'Planned' ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>
                            {dept.status === 'Planned' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{dept.name}</p>
                            <p className="text-xs text-muted-foreground">{dept.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
