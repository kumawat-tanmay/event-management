'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';

interface CustomerFormProps {
  isEdit?: boolean;
}

export function CustomerForm({ isEdit = false }: CustomerFormProps) {
  const router = useRouter();
  const [customerType, setCustomerType] = useState(isEdit ? 'Corporate' : 'Retail');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save and redirect
    router.push('/crm/customers');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={isEdit ? "Edit Customer" : "Add New Customer"}
            description={isEdit ? "Update client details and credit limits." : "Create a new retail or corporate customer profile."}
          />
        </div>
      </div>
      
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-2 max-w-sm mb-6">
              <label className="text-sm font-medium">Customer Type <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="Retail" 
                    checked={customerType === 'Retail'} 
                    onChange={() => setCustomerType('Retail')} 
                    className="accent-primary"
                  />
                  <span>Retail / Individual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="Corporate" 
                    checked={customerType === 'Corporate'} 
                    onChange={() => setCustomerType('Corporate')}
                    className="accent-primary"
                  />
                  <span>Corporate Agency</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer / Company Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. Royal Weddings or Ramesh Sharma"
                  defaultValue={isEdit ? "Royal Weddings Agency" : ""}
                  required
                />
              </div>
              
              {customerType === 'Corporate' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Person Name</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="e.g. Vikram Singh"
                    defaultValue={isEdit ? "Vikram Singh" : ""}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. 9829012345"
                  defaultValue={isEdit ? "9829054321" : ""}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. contact@royalweddings.com"
                  defaultValue={isEdit ? "contact@royalweddings.com" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Address <span className="text-red-500">*</span></label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Enter complete billing address"
                defaultValue={isEdit ? "123 MI Road, Jaipur, Rajasthan" : ""}
                required
              ></textarea>
            </div>

            {customerType === 'Corporate' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GSTIN Number</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary uppercase"
                    placeholder="e.g. 08AAAAA0000A1Z5"
                    defaultValue={isEdit ? "08ROYAL54321A1Z" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Credit Limit Amount (₹)</label>
                  <input 
                    type="number" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="e.g. 1000000"
                    defaultValue={isEdit ? "1000000" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Term Days</label>
                  <input 
                    type="number" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="e.g. 30"
                    defaultValue={isEdit ? "30" : "0"}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEdit ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
