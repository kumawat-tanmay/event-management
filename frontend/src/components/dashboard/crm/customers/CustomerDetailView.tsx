'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2, Briefcase, FileText, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function CustomerDetailView() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('BOOKING HISTORY');

  const customerData = {
    id: '2',
    name: 'Royal Weddings Agency',
    type: 'Corporate',
    contactPerson: 'Vikram Singh',
    phone: '+91 9829054321',
    email: 'contact@royalweddings.com',
    address: '123 MI Road, Jaipur, Rajasthan',
    gstin: '08ROYAL54321A1Z',
    creditLimit: 1000000,
    outstanding: 150000,
    status: 'Active'
  };

  const bookingHistory = [
    { id: 'B-1001', date: '15 Oct 2026', type: 'Destination Wedding', amount: 450000, status: 'Completed' },
    { id: 'B-1042', date: '22 Nov 2026', type: 'Corporate Gala', amount: 200000, status: 'Confirmed' },
    { id: 'B-1089', date: '05 Dec 2026', type: 'Sangeet Ceremony', amount: 150000, status: 'Pending' },
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
            title="Customer Profile" 
            description="View complete details, booking history, and account statement."
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/customers/${customerData.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${customerData.type === 'Corporate' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {customerData.type} Client
                </span>
                <StatusBadge status={customerData.status} />
              </div>
              <CardTitle className="text-xl font-bold">{customerData.name}</CardTitle>
              {customerData.contactPerson && (
                <p className="text-sm text-muted-foreground mt-1">Contact: {customerData.contactPerson}</p>
              )}
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{customerData.phone}</p>
                  <p className="text-xs text-muted-foreground">Primary Mobile</p>
                </div>
              </div>
              
              {customerData.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{customerData.email}</p>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{customerData.address}</p>
                  <p className="text-xs text-muted-foreground">Billing Address</p>
                </div>
              </div>

              {customerData.type === 'Corporate' && (
                <div className="flex items-start gap-3 pt-4 border-t border-border mt-4">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider">{customerData.gstin}</p>
                    <p className="text-xs text-muted-foreground">GSTIN Number</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Limit Gauge Card (For Corporate) */}
          {customerData.type === 'Corporate' && (
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Credit Limit Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-bold text-error">₹ {(customerData.outstanding / 100000).toFixed(2)}L</p>
                    <p className="text-xs text-muted-foreground font-medium">Outstanding Balance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹ {(customerData.creditLimit / 100000).toFixed(2)}L</p>
                    <p className="text-xs text-muted-foreground">Total Limit</p>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2.5 mt-4">
                  <div className="bg-error h-2.5 rounded-full" style={{ width: `${(customerData.outstanding / customerData.creditLimit) * 100}%` }}></div>
                </div>
                
                <div className="mt-6">
                  <Button variant="outline" className="w-full text-xs" onClick={() => router.push('/finance/payments/new')}>
                    + Record Bulk Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Tabs (History/Statement) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <div className="border-b border-border flex items-center gap-1 p-2 shrink-0">
              {['BOOKING HISTORY', 'ACCOUNT STATEMENT'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {tab === 'BOOKING HISTORY' ? <Briefcase className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>
            
            <CardContent className="pt-6 flex-1">
              {activeTab === 'BOOKING HISTORY' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Recent Bookings</h3>
                    <Button variant="primary" size="sm" onClick={() => router.push('/bookings/new')}>
                      + New Booking
                    </Button>
                  </div>
                  
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Booking ID</th>
                          <th className="px-4 py-3 font-semibold">Event Date</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold text-right">Amount (₹)</th>
                          <th className="px-4 py-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bookingHistory.map((booking) => (
                          <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-primary">
                              <span className="cursor-pointer hover:underline">{booking.id}</span>
                            </td>
                            <td className="px-4 py-3">{booking.date}</td>
                            <td className="px-4 py-3">{booking.type}</td>
                            <td className="px-4 py-3 font-medium text-right">{booking.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <StatusBadge status={booking.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="w-12 h-12 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Account Statement Ledger</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    View the complete debit and credit history for this customer across all bookings and payments.
                  </p>
                  <Button variant="outline">
                    Generate Ledger PDF
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
          router.push('/crm/customers');
        }}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerData.name}? This will remove their quotation history but active bookings will remain.`}
        confirmText="Delete Customer"
      />
    </div>
  );
}
