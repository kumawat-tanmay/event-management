'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Download, Printer, CheckCircle2, Box, Truck } from 'lucide-react';

export function PurchaseDetailView() {
  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/purchases">
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">PO-2025-045</h1>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Pending Approval
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Date: 15 May 2025 • Vendor: Ramesh Tents & Decorators</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-card hover:bg-muted border border-border text-foreground px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <CheckCircle2 size={16} />
            <span>Approve PO</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Summary</h3>
            
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-display font-bold text-foreground mt-1">₹ 29,500</p>
            </div>
            
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Expected Date</p>
                <p className="text-sm font-bold text-foreground mt-0.5">20 May 2025</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Linked Event</p>
                <p className="text-sm font-bold text-foreground mt-0.5">Sharma Wedding</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Vendor Info</h3>
            <div>
              <p className="text-sm font-bold text-foreground">Ramesh Tents & Decorators</p>
              <p className="text-xs text-muted-foreground mt-1">+91 9876543210</p>
              <p className="text-xs text-muted-foreground mt-0.5">123, Decorators Market, Jaipur</p>
            </div>
            <Link href="/vendors/1">
              <button className="text-xs font-bold text-primary hover:underline mt-2">View Profile →</button>
            </Link>
          </div>
        </div>

        {/* Right Column: Line Items & Lifecycle */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Timeline */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Order Lifecycle</h3>
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -translate-y-1/2 z-0"></div>
              <div className="absolute left-0 top-1/2 w-1/4 h-1 bg-primary -translate-y-1/2 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">1</div>
                <span className="text-xs font-bold text-foreground">Draft</span>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm border-4 border-card">2</div>
                <span className="text-xs font-bold text-amber-600">Approval</span>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2 opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">3</div>
                <span className="text-xs font-bold text-muted-foreground">Sent</span>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2 opacity-50">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">4</div>
                <span className="text-xs font-bold text-muted-foreground">Received</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Rate</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">Premium Floral Decor Set</td>
                    <td className="px-5 py-3 text-muted-foreground">1</td>
                    <td className="px-5 py-3 text-muted-foreground">₹ 25,000</td>
                    <td className="px-5 py-3 font-bold text-foreground text-right">₹ 25,000</td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted/10">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-right font-medium text-muted-foreground">Subtotal</td>
                    <td className="px-5 py-3 font-bold text-foreground text-right">₹ 25,000</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-right font-medium text-muted-foreground">GST (18%)</td>
                    <td className="px-5 py-3 font-bold text-foreground text-right">₹ 4,500</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 py-4 text-right font-bold text-foreground">Grand Total</td>
                    <td className="px-5 py-4 font-bold text-primary text-lg text-right">₹ 29,500</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
