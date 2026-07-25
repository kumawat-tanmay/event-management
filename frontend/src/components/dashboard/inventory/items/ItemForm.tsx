'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Box, IndianRupee, Settings } from 'lucide-react';

interface ItemFormProps {
  isEditing?: boolean;
}

export function ItemForm({ isEditing = false }: ItemFormProps) {
  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/inventory/items">
            <button className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Item' : 'Add New Item'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Update item details and rental rates.' : 'Add a new product to your inventory catalog.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/inventory/items" className="flex-1 sm:flex-none">
            <button className="w-full bg-card hover:bg-muted border border-border text-foreground px-6 py-2.5 rounded-xl font-medium transition-colors">
              Cancel
            </button>
          </Link>
          <button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <Save size={18} />
            <span>{isEditing ? 'Update Item' : 'Save Item'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <Box className="w-5 h-5 text-primary" />
              <h2>Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Premium Sofa Set" 
                  defaultValue={isEditing ? 'Premium Sofa Set' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Code / SKU *</label>
                <input 
                  type="text" 
                  placeholder="e.g. ITM-001" 
                  defaultValue={isEditing ? 'ITM-001' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
                <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option>Select Category...</option>
                  <option selected={isEditing}>Furniture</option>
                  <option>Lighting</option>
                  <option>Tents</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Details about this item..." 
                  defaultValue={isEditing ? 'High quality white leather premium sofa for VIP seating.' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <IndianRupee className="w-5 h-5 text-primary" />
              <h2>Pricing Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rental Price (per day) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    defaultValue={isEditing ? '1200' : ''}
                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Replacement Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    defaultValue={isEditing ? '15000' : ''}
                    className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory Settings */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-foreground font-bold text-lg">
              <Settings className="w-5 h-5 text-primary" />
              <h2>Settings</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unit of Measurement</label>
                <select className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                  <option selected={isEditing}>Pieces (Pcs)</option>
                  <option>Sets</option>
                  <option>Square Feet (SqFt)</option>
                  <option>Meters</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Low Stock Alert Minimum</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5" 
                  defaultValue={isEditing ? '10' : ''}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-bold text-foreground">Active Item</p>
                  <p className="text-xs text-muted-foreground">Item can be rented</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Stub */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Item Image</h3>
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-3">
                <Box size={24} />
              </div>
              <p className="text-sm font-bold text-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
