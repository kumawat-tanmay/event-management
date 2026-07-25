'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Briefcase, Phone, MapPin, Building, CreditCard } from 'lucide-react';

interface VendorFormProps {
  isEditing?: boolean;
}

export function VendorForm({ isEditing = false }: VendorFormProps) {
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
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Update vendor details and financial information.' : 'Register a new supplier, decorator, or contractor.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/vendors" className="flex-1 sm:flex-none">
            <button className="w-full bg-card hover:bg-muted border border-border text-foreground px-6 py-2.5 rounded-xl font-medium transition-colors">
              Cancel
            </button>
          </Link>
          <button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <Save size={18} />
            <span>{isEditing ? 'Update Vendor' : 'Save Vendor'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2>Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendor Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Tents & Decorators" 
                  defaultValue={isEditing ? 'Ramesh Tents & Decorators' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Type</label>
                <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option>Select Type</option>
                  <option selected={isEditing}>Decor</option>
                  <option>Catering</option>
                  <option>Sound & Light</option>
                  <option>Transport</option>
                  <option>Labor / Manpower</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option selected={isEditing}>Active</option>
                  <option>Inactive</option>
                  <option>Blacklisted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <Phone className="w-5 h-5 text-primary" />
              <h2>Contact Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Contact *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  defaultValue={isEditing ? 'Ramesh Kumar' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="+91" 
                  defaultValue={isEditing ? '+91 9876543210' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="vendor@example.com" 
                  defaultValue={isEditing ? 'contact@rameshtents.com' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Address
                </label>
                <textarea 
                  rows={3}
                  placeholder="Full office or godown address..." 
                  defaultValue={isEditing ? '123, Decorators Market, Jaipur, Rajasthan' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Additional Info */}
        <div className="space-y-6">
          {/* Financial & Tax Details */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <Building className="w-5 h-5 text-primary" />
              <h2>Financial Details</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GSTIN Number</label>
                <input 
                  type="text" 
                  placeholder="22AAAAA0000A1Z5" 
                  defaultValue={isEditing ? '08AABCR1234F1Z5' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PAN Number</label>
                <input 
                  type="text" 
                  placeholder="ABCDE1234F" 
                  defaultValue={isEditing ? 'AABCR1234F' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opening Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    defaultValue={isEditing ? '45000' : ''}
                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2>Bank Details</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bank Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDFC Bank" 
                  defaultValue={isEditing ? 'SBI' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1234567890" 
                  defaultValue={isEditing ? '34567890123' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">IFSC Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDFC0001234" 
                  defaultValue={isEditing ? 'SBIN0001234' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
