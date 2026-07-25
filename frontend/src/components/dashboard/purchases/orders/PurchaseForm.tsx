'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, ShoppingBag, FileText, IndianRupee } from 'lucide-react';

interface PurchaseFormProps {
  isEditing?: boolean;
}

export function PurchaseForm({ isEditing = false }: PurchaseFormProps) {
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
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Update PO details and line items.' : 'Generate a new PO for vendors.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/purchases" className="flex-1 sm:flex-none">
            <button className="w-full bg-card hover:bg-muted border border-border text-foreground px-6 py-2.5 rounded-xl font-medium transition-colors">
              Cancel
            </button>
          </Link>
          <button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <Save size={18} />
            <span>{isEditing ? 'Update PO' : 'Save as Draft'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2>PO Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Vendor *</label>
                <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option>Select a vendor...</option>
                  <option selected={isEditing}>Ramesh Tents & Decorators</option>
                  <option>Shiva Caterers</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date *</label>
                <input 
                  type="date"
                  defaultValue={isEditing ? '2025-05-15' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expected Delivery</label>
                <input 
                  type="date"
                  defaultValue={isEditing ? '2025-05-20' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Linked Event / Purpose</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sharma Wedding, Inventory Restock..." 
                  defaultValue={isEditing ? 'Sharma Wedding Setup' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <FileText className="w-5 h-5 text-primary" />
              <h2>Line Items</h2>
            </div>
            
            <div className="space-y-4">
              {/* Dummy Item Row */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item / Service</label>
                  <input type="text" defaultValue="Premium Floral Decor Set" className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qty</label>
                  <input type="number" defaultValue="1" className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm" />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate (₹)</label>
                  <input type="number" defaultValue="25000" className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm" />
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold pt-3 pb-2">₹ 25,000</p>
                </div>
              </div>

              <button className="text-sm font-bold text-primary hover:underline">+ Add another item</button>
            </div>
          </div>
        </div>

        {/* Sidebar / Financials */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <IndianRupee className="w-5 h-5 text-primary" />
              <h2>PO Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">₹ 25,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes (GST 18%)</span>
                <span className="font-medium text-foreground">₹ 4,500</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between">
                <span className="font-bold text-foreground">Total Amount</span>
                <span className="font-bold text-primary text-lg">₹ 29,500</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes & Terms</h3>
            <textarea 
              rows={4}
              placeholder="Terms and conditions for this PO..."
              defaultValue={isEditing ? 'Payment 50% advance, 50% on delivery.' : ''}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
