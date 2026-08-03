'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building, CreditCard, FileText, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { ActionGuard } from '@/components/auth/ActionGuard';

export function VendorDetail() {
  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vendors">
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Ramesh Tents & Decorators</h1>
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">ID: VEND-0001 • Decor Category</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-card hover:bg-muted border border-border text-foreground px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <FileText size={16} />
            <span>Ledger</span>
          </button>
          <ActionGuard permission="purchases.update">
            <Link href="/vendors/1/edit" className="flex-1 sm:flex-none">
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                <Edit size={16} />
                <span>Edit</span>
              </button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Stats & Contact */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Outstanding Due</p>
                <p className="text-3xl font-display font-bold text-error">₹ 45,000</p>
              </div>
              <div className="pt-4 border-t border-border flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Billed</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">₹ 2,50,000</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">₹ 2,05,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact Info</h3>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Phone</p>
                <p className="text-sm font-medium text-foreground mt-0.5">+91 9876543210</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ramesh Kumar</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-medium text-foreground mt-0.5">contact@rameshtents.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Office Address</p>
                <p className="text-sm font-medium text-foreground mt-0.5 leading-relaxed">
                  123, Decorators Market, Near Station, Jaipur, Rajasthan 302001
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Details & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tax Details */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-foreground font-bold">
                <Building className="w-4 h-4 text-primary" />
                <h3>Tax Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">GSTIN</p>
                  <p className="text-sm font-medium text-foreground uppercase mt-0.5">08AABCR1234F1Z5</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PAN Number</p>
                  <p className="text-sm font-medium text-foreground uppercase mt-0.5">AABCR1234F</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-foreground font-bold">
                <CreditCard className="w-4 h-4 text-primary" />
                <h3>Bank Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">State Bank of India (SBI)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account / IFSC</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">34567890123 / SBIN0001234</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-card border border-border rounded-2xl p-0 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Recent Purchase Orders</h3>
              <Link href="/purchases" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">PO Number</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Event/Purpose</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">PO-2025-045</td>
                    <td className="px-5 py-3 text-muted-foreground">15 May 2025</td>
                    <td className="px-5 py-3 text-muted-foreground">Wedding (Sharma)</td>
                    <td className="px-5 py-3 font-bold text-foreground">₹ 25,000</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Pending</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">PO-2025-042</td>
                    <td className="px-5 py-3 text-muted-foreground">10 May 2025</td>
                    <td className="px-5 py-3 text-muted-foreground">Corporate Event</td>
                    <td className="px-5 py-3 font-bold text-foreground">₹ 15,000</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Paid</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
