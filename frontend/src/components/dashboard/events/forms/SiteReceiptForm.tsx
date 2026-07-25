'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, FileSignature, MapPin, AlertTriangle, 
  CheckCircle2, Camera, Clock, Save
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';

export function SiteReceiptForm() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [condition, setCondition] = useState('OK');
  const [remarks, setRemarks] = useState('');

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Site Receipt Verification" 
            description={`Verify material received at site for ${eventId || 'Event'}`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="primary" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Submit Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Delivery Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Dispatch #DSP-291
                </span>
                <StatusBadge status="Delivered" />
              </div>
              <CardTitle className="text-lg font-bold leading-tight">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fairmont Hotel, Jaipur, Rajasthan</p>
                  <p className="text-xs text-muted-foreground">Site Address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">14 Oct 2026, 04:30 PM</p>
                  <p className="text-xs text-muted-foreground">Arrival Date & Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Receipt Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Verification Form
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-8 flex-1">
              
              {/* Material Condition */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Material Condition at Site</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setCondition('OK')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'OK' ? "border-success bg-success/10 text-success" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold text-sm">All OK</span>
                  </div>
                  <div 
                    onClick={() => setCondition('Damaged')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'Damaged' ? "border-error bg-error/10 text-error" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-bold text-sm">Damaged in Transit</span>
                  </div>
                  <div 
                    onClick={() => setCondition('Shortage')}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all text-center",
                      condition === 'Shortage' ? "border-warning bg-warning/10 text-warning" : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-bold text-sm">Shortage / Missing</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  Site Remarks & Discrepancies
                  <span className="text-xs font-normal text-muted-foreground">(Required if Damaged or Shortage)</span>
                </label>
                <textarea 
                  className="w-full h-32 p-3 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe any issues with the received material..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {/* Upload Proof */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Upload Proof / Photos</label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-bold text-foreground mb-1">Click to upload photos</p>
                  <p className="text-xs text-muted-foreground">Upload images of damaged items or site condition</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
