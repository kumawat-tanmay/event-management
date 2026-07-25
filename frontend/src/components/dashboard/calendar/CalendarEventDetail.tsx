'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function CalendarEventDetail() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleEdit = () => {
    router.push('/calendar/1/edit');
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setDeleteModalOpen(false);
    router.push('/calendar');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title="Event Details" 
            description="View complete details of this scheduled event."
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wedding</span>
                    <StatusBadge status="Upcoming" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Sharma Wedding</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Date</p>
                    <p className="font-semibold mt-0.5">15 Oct 2026</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Time</p>
                    <p className="font-semibold mt-0.5">18:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Location</p>
                    <p className="font-semibold mt-0.5">Grand Taj Resort, Jaipur</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Expected Guests</p>
                    <p className="font-semibold mt-0.5">500 Pax</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Event Notes</h4>
                <p className="text-sm leading-relaxed">
                  Client wants premium seating for 50 VIPs. Make sure to double-check the lighting arrangements near the stage. Entry gate decoration should be as per the catalog design #45.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              <Button variant="primary" className="w-full justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Go to Event Planner
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View Quotation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Manage Dispatches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This will remove it from the calendar permanently."
        confirmText="Delete Event"
      />
    </div>
  );
}
