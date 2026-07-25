'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';

interface SiteVisitFormProps {
  isEdit?: boolean;
}

export function SiteVisitForm({ isEdit = false }: SiteVisitFormProps) {
  const router = useRouter();
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/crm/site-visits');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={isEdit ? "Edit Site Visit" : "Schedule Site Visit"}
            description={isEdit ? "Update inspection details." : "Assign a supervisor to inspect a venue."}
          />
        </div>
      </div>
      
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>Schedule Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link to Lead / Customer <span className="text-red-500">*</span></label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  defaultValue={isEdit ? "LD-1002" : ""}
                  required
                >
                  <option value="" disabled>Select Lead</option>
                  <option value="LD-1001">LD-1001 - Rahul Verma</option>
                  <option value="LD-1002">LD-1002 - Anjali Sharma</option>
                  <option value="LD-1005">LD-1005 - TechCorp Pvt Ltd</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue Name / Location <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. Shiv Vilas Resort"
                  defaultValue={isEdit ? "Shiv Vilas, Jaipur" : ""}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Time <span className="text-red-500">*</span></label>
                <input 
                  type="time" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Supervisor <span className="text-red-500">*</span></label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  defaultValue={isEdit ? "Amit" : ""}
                  required
                >
                  <option value="" disabled>Select Supervisor</option>
                  <option value="Amit">Amit (Supervisor)</option>
                  <option value="Ravi">Ravi (Manager)</option>
                  <option value="Suresh">Suresh</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  defaultValue={isEdit ? "Pending" : "Pending"}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Instructions for Supervisor</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="E.g., Check if 40x40 tent can fit in the garden area..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEdit ? "Save Changes" : "Schedule Visit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
