'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Plus, Trash2, CalendarDays, Calculator, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ItemSelector } from './ItemSelector';

export function QuotationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    type: 'Custom',
    startDate: '',
    endDate: '',
    transportCharge: 0,
    labourCharge: 0,
    discount: 0,
  });

  const [items, setItems] = useState<any[]>([]);

  const handleAddItems = (newItems: any[]) => {
    // Check if item already exists, if so add qty, else push new
    const updatedItems = [...items];
    
    newItems.forEach(newItem => {
      const existingIdx = updatedItems.findIndex(i => i.id === newItem.id);
      if (existingIdx >= 0) {
        updatedItems[existingIdx].qty += newItem.qty;
        updatedItems[existingIdx].total = updatedItems[existingIdx].qty * updatedItems[existingIdx].rate;
      } else {
        updatedItems.push(newItem);
      }
    });

    setItems(updatedItems);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      router.push('/operations/quotations');
    }, 1000);
  };

  // Calculations
  const itemTotal = items.reduce((acc, item) => acc + item.total, 0);
  const subTotal = itemTotal + Number(formData.transportCharge) + Number(formData.labourCharge);
  const discountAmount = (subTotal * Number(formData.discount)) / 100;
  const taxableAmount = subTotal - discountAmount;
  const gst = taxableAmount * 0.18; // 18% GST
  const grandTotal = taxableAmount + gst;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Create Quotation</h2>
          <p className="text-sm font-medium text-muted-foreground">Draft a new event estimate and select inventory items.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Customer</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value, customerName: e.target.options[e.target.selectedIndex].text})}
                    required
                  >
                    <option value="">Select a customer...</option>
                    <option value="C001">Ramesh Sharma (Retail)</option>
                    <option value="C002">Royal Weddings (Corporate)</option>
                    <option value="C003">Fairmont Hotel (Corporate)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Quotation Type</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Custom">Custom Order</option>
                    <option value="Ready-Made">Ready-Made Package</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Event Start Date" 
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
                <Input 
                  label="Event End Date" 
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Quotation Items
                </CardTitle>
                <CardDescription>Add inventory items and view stock availability.</CardDescription>
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsItemSelectorOpen(true)}
                className="flex items-center gap-2"
                disabled={!formData.startDate || !formData.endDate}
              >
                <Plus className="w-4 h-4" />
                Add Items
              </Button>
            </CardHeader>
            <CardContent>
              {!formData.startDate || !formData.endDate ? (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                  <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-medium">Please select event dates first to check item availability.</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground font-medium mb-3">No items added to this quotation yet.</p>
                  <Button type="button" variant="primary" onClick={() => setIsItemSelectorOpen(true)}>
                    Select Items from Inventory
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 rounded-l-lg font-medium">Item Details</th>
                        <th className="px-4 py-2 font-medium">Rate/Day</th>
                        <th className="px-4 py-2 font-medium">Qty</th>
                        <th className="px-4 py-2 font-medium text-right">Total</th>
                        <th className="px-4 py-2 rounded-r-lg"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code}</p>
                          </td>
                          <td className="px-4 py-3 font-medium">₹{item.rate}</td>
                          <td className="px-4 py-3 font-bold">{item.qty} {item.unit}</td>
                          <td className="px-4 py-3 font-bold text-right">₹{item.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Calculations & Actions */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Items Total</span>
                  <span className="font-bold">₹ {itemTotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Transport Charge" 
                      type="number"
                      value={formData.transportCharge}
                      onChange={(e) => setFormData({...formData, transportCharge: Number(e.target.value)})}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Labour Charge" 
                      type="number"
                      value={formData.labourCharge}
                      onChange={(e) => setFormData({...formData, labourCharge: Number(e.target.value)})}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground font-medium">Sub Total</span>
                  <span className="font-bold">₹ {subTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Discount (%)</span>
                  <Input 
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                    className="h-8 w-20"
                    max="100"
                  />
                  <span className="text-sm font-bold text-success ml-auto">- ₹ {discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Taxable Amount</span>
                  <span className="font-bold">₹ {taxableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">GST (18%)</span>
                  <span className="font-bold">₹ {gst.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-black text-foreground">Grand Total</span>
                <span className="text-xl font-black text-primary">₹ {grandTotal.toLocaleString()}</span>
              </div>

              <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading || items.length === 0}>
                {loading ? 'Saving...' : 'Save Quotation'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <ItemSelector 
        isOpen={isItemSelectorOpen} 
        onClose={() => setIsItemSelectorOpen(false)}
        onAddItems={handleAddItems}
        startDate={formData.startDate}
        endDate={formData.endDate}
      />
    </div>
  );
}
