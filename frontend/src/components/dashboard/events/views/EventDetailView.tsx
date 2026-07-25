'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, 
  CalendarDays, Clock, User, CheckCircle2, 
  Box, Images, ClipboardList, Info, Users, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function EventDetailView() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Dummy data
  const eventData = {
    id: 'EVT-2026-089',
    name: 'Aditi & Rahul Royal Wedding',
    type: 'Wedding',
    status: 'In Progress',
    startDate: '15 Oct 2026',
    endDate: '17 Oct 2026',
    venue: 'Fairmont Hotel, Jaipur, Rajasthan',
    customer: {
      id: 'CUST-104',
      name: 'Aditi Sharma',
      phone: '+91 9876543210',
      email: 'aditi.sharma@example.com'
    },
    manager: 'Vikram Singh',
    progress: 75,
    budget: 1500000,
    notes: 'Client has requested a specific floral arrangement for the Mandap. Ensure all white orchids are sourced from the premium vendor.'
  };

  const timeline = [
    { time: '15 Oct, 10:00 AM', title: 'Haldi Ceremony', location: 'Poolside' },
    { time: '15 Oct, 08:00 PM', title: 'Sangeet', location: 'Grand Ballroom' },
    { time: '16 Oct, 07:00 PM', title: 'Main Wedding', location: 'Main Lawn' },
    { time: '17 Oct, 10:00 AM', title: 'Checkout & Packup', location: 'All Venues' }
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Event Dashboard" 
            description={`Manage all execution details for ${eventData.id}`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/events/list/${eventData.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Cancel Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {eventData.type}
                </span>
                <StatusBadge status={eventData.status} />
              </div>
              <CardTitle className="text-xl font-bold leading-tight">{eventData.name}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-5">
              {/* Dates */}
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{eventData.startDate} to {eventData.endDate}</p>
                  <p className="text-xs text-muted-foreground">Event Schedule</p>
                </div>
              </div>
              
              {/* Venue */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{eventData.venue}</p>
                  <p className="text-xs text-muted-foreground">Venue Location</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Details</p>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary hover:underline cursor-pointer" onClick={() => router.push(`/crm/customers/${eventData.customer.id}`)}>
                      {eventData.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Primary Client</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{eventData.customer.phone}</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Execution Progress Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Execution Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-2xl font-bold text-foreground">{eventData.progress}%</p>
                <p className="text-xs text-muted-foreground font-medium mb-1">Setup Complete</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div className="bg-success h-2.5 rounded-full transition-all duration-500" style={{ width: `${eventData.progress}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed text-center">
                Managed by <strong>{eventData.manager}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <div className="border-b border-border flex items-center overflow-x-auto p-2 shrink-0 no-scrollbar">
              {['OVERVIEW', 'TIMELINE', 'LOGISTICS', 'GALLERY'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === tab
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {tab === 'OVERVIEW' && <Info className="w-4 h-4" />}
                  {tab === 'TIMELINE' && <Clock className="w-4 h-4" />}
                  {tab === 'LOGISTICS' && <Box className="w-4 h-4" />}
                  {tab === 'GALLERY' && <Images className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>
            
            <CardContent className="pt-6 flex-1">
              {/* OVERVIEW TAB */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      Important Notes & Brief
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {eventData.notes}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Assigned Event Manager</p>
                      <p className="text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {eventData.manager}
                      </p>
                    </div>
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Team Size</p>
                      <p className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        15 Staff Members
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'TIMELINE' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Event Itinerary</h3>
                    <Button variant="outline" size="sm">+ Add Schedule</Button>
                  </div>
                  <div className="relative border-l border-border ml-3 space-y-6">
                    {timeline.map((item, index) => (
                      <div key={index} className="pl-6 relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1 border-2 border-background"></div>
                        <p className="text-xs font-bold text-primary mb-1">{item.time}</p>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LOGISTICS TAB */}
              {activeTab === 'LOGISTICS' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Box className="w-12 h-12 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Inventory & Dispatch</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Manage packing checklists, warehouse dispatches, and site receipts for this event.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="primary">View Packing Checklist</Button>
                    <Button variant="outline">Site Receipt Form</Button>
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'GALLERY' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Images className="w-12 h-12 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Event Photos</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Upload photos of the site setup, damages, and final execution here for proof of work.
                  </p>
                  <Button variant="primary">
                    <Images className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          setDeleteModalOpen(false);
          router.push('/events/list');
        }}
        title="Cancel Event"
        message={`Are you sure you want to cancel the event "${eventData.name}"? This will release all blocked inventory.`}
        confirmText="Yes, Cancel Event"
      />
    </div>
  );
}
