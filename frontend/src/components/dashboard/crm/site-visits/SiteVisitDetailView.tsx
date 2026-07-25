'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, Clock, User, Zap, Truck, Ruler, Camera, CheckSquare, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function SiteVisitDetailView() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const visitData = {
    id: 'SV-1001',
    leadId: 'LD-1002',
    customerName: 'Anjali Sharma',
    venue: 'Shiv Vilas, Jaipur',
    date: '15 Jul 2026',
    time: '11:00 AM',
    supervisor: 'Amit',
    status: 'Completed',
    notes: 'Garden area is slightly sloped. Need levelling platforms for the main stage. Main entrance is wide enough for large trucks.',
    
    // Measurement & Checks completed by supervisor
    measurements: 'Main Lawn: 150ft x 120ft, Stage Area: 40ft x 30ft',
    powerSupply: 'Available (3 Phase, 60kW)',
    vehicleAccess: 'Heavy Truck Access Available',
    surfaceType: 'Grass / Lawn',
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Site Visit Details" 
            description={`Inspection report for ${visitData.venue}.`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/site-visits/${visitData.id}/edit`)}>
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
        {/* Left Column: Basic Details & Supervisor Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-primary">{visitData.id}</span>
                <StatusBadge status={visitData.status} />
              </div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                {visitData.venue}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Customer / Lead</p>
                <p className="font-semibold">{visitData.customerName} <span className="text-muted-foreground font-normal text-sm">({visitData.leadId})</span></p>
              </div>

              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </p>
                  <p className="font-semibold">{visitData.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time
                  </p>
                  <p className="font-semibold">{visitData.time}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5" /> Assigned Supervisor
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {visitData.supervisor.charAt(0)}
                  </div>
                  <span className="font-semibold">{visitData.supervisor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button variant="primary" className="w-full justify-start" onClick={() => router.push(`/quotations/new?lead=${visitData.leadId}`)}>
                Create Quotation
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/crm/leads/${visitData.leadId}`)}>
                View Lead Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inspection Report Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Inspection Report</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Ruler className="w-4 h-4" /> Space & Measurements
                  </div>
                  <p className="text-sm">{visitData.measurements}</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Zap className="w-4 h-4" /> Power Supply
                  </div>
                  <p className="text-sm">{visitData.powerSupply}</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Truck className="w-4 h-4" /> Vehicle Access
                  </div>
                  <p className="text-sm">{visitData.vehicleAccess}</p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <MapPin className="w-4 h-4" /> Surface Type
                  </div>
                  <p className="text-sm">{visitData.surfaceType}</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground border-b border-border pb-2">Supervisor Notes & Remarks</h4>
                <p className="text-sm leading-relaxed p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  {visitData.notes}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Site Photos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Dummy Photo Placeholders */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden relative group">
                      <Camera className="w-8 h-8 text-muted-foreground/30" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
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
          router.push('/crm/site-visits');
        }}
        title="Delete Site Visit"
        message="Are you sure you want to delete this site visit report? The associated lead will not be deleted."
        confirmText="Delete Visit"
      />
    </div>
  );
}
