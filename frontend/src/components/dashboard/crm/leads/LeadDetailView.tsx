'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Phone, Calendar, User, MapPin, IndianRupee, MessageSquare, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function LeadDetailView() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const leadData = {
    id: 'LD-1002',
    customerName: 'Anjali Sharma',
    phone: '+91 9876543211',
    eventType: 'Birthday',
    date: '22 Nov 2026',
    source: 'Reference',
    stage: 'Site Visit',
    budget: 120000,
    assignedTo: 'Ravi (Manager)',
    notes: 'Looking for a premium floral decoration theme. Needs 50 chairs and 5 round tables.'
  };

  const timeline = [
    { date: '12 Jul 2026', time: '10:30 AM', title: 'Lead Created', description: 'Inquiry received via Reference.', type: 'created' },
    { date: '12 Jul 2026', time: '02:15 PM', title: 'First Contact', description: 'Called customer, discussed basic requirements.', type: 'contact' },
    { date: '13 Jul 2026', time: '11:00 AM', title: 'Site Visit Scheduled', description: 'Scheduled venue inspection for 15 Jul.', type: 'visit' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Lead Details" 
            description={`Manage inquiry pipeline for ${leadData.customerName}.`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/leads/${leadData.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">{leadData.id}</span>
                    <StatusBadge status="In Progress" customText={leadData.stage} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{leadData.customerName}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Contact Phone</p>
                    <p className="font-semibold mt-0.5">{leadData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Proposed Event Date</p>
                    <p className="font-semibold mt-0.5">{leadData.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Event Type</p>
                    <p className="font-semibold mt-0.5">{leadData.eventType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Expected Budget</p>
                    <p className="font-semibold mt-0.5">₹ {leadData.budget.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Notes & Requirements</h4>
                <p className="text-sm leading-relaxed">{leadData.notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Timeline */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              <Button variant="primary" className="w-full justify-start" onClick={() => router.push('/crm/site-visits/new')}>
                <MapPin className="w-4 h-4 mr-2" />
                Schedule Site Visit
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/quotations/new')}>
                <FileText className="w-4 h-4 mr-2" />
                Create Quotation
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {item.type === 'visit' ? <MapPin className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      {i !== timeline.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-xs text-muted-foreground mb-1">{item.date} • {item.time}</p>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          setDeleteModalOpen(false);
          router.push('/crm/leads');
        }}
        title="Delete Lead"
        message={`Are you sure you want to delete ${leadData.customerName}? This inquiry will be permanently lost.`}
        confirmText="Delete Lead"
      />
    </div>
  );
}
