'use client';

import React, { useState, useEffect } from 'react';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { invoiceService } from '@/lib/services/invoice.services';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';

interface InvoiceBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceBuilder({ onClose, onSuccess }: InvoiceBuilderProps) {
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const [formData, setFormData] = useState({
    bookingId: '',
    discount: 0
  });

  useEffect(() => {
    // Load bookings for selection
    bookingService.getBookings({ limit: 100 })
      .then(res => {
        setBookings(res.data || []);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        toast.error('Failed to load active bookings list');
      });
  }, []);

  const handleBookingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookingId = e.target.value;
    const booking = bookings.find(b => b._id === bookingId) || null;
    setSelectedBooking(booking);
    
    setFormData(prev => ({
      ...prev,
      bookingId,
      discount: 0
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookingId) {
      return toast.error('Please select an event booking');
    }

    setSubmitting(true);
    try {
      await invoiceService.createInvoice(formData);
      toast.success('Tax invoice generated successfully');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate tax invoice';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate taxes on change for preview
  const subtotal = selectedBooking?.subtotal || 0;
  const gstRate = selectedBooking?.taxRate || 18;
  const originalTax = selectedBooking?.taxAmount || 0;
  const taxableAmount = Math.max(0, subtotal - formData.discount);
  const estimatedTax = Math.round((taxableAmount * gstRate) / 100);
  const cgst = Number((estimatedTax / 2).toFixed(2));
  const sgst = Number((estimatedTax / 2).toFixed(2));
  const estimatedTotal = taxableAmount + estimatedTax;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans text-foreground">
      {/* Booking Selection */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Select Active Booking</label>
        <select
          name="bookingId"
          value={formData.bookingId}
          onChange={handleBookingChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          required
        >
          <option value="">-- Choose Booking --</option>
          {bookings.map(b => (
            <option key={b._id} value={b._id}>
              {b.bookingId} - {b.eventTitle} ({b.customer?.name || 'Walk-in'})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Booking Info Details */}
      {selectedBooking && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-sm">
            <p className="font-bold text-primary">Customer Billing Profile</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Customer Name</span>
                <span className="font-semibold">{selectedBooking.customer?.name || 'Walk-in'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">GSTIN / Tax ID</span>
                <span className="font-semibold">{selectedBooking.customer?.gstNumber || '—'}</span>
              </div>
            </div>
          </div>

          {/* Discount Input */}
          <div className="space-y-2 max-w-xs">
            <label className="text-sm font-bold">Apply Cash Discount (₹)</label>
            <input
              type="number"
              name="discount"
              value={formData.discount || ''}
              onChange={handleChange}
              placeholder="e.g. 500"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Calculations Preview */}
          <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-3 text-sm">
            <p className="font-bold text-foreground">Tax Invoice Calculation Preview</p>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹ {subtotal.toLocaleString()}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-error">
                <span>Discount</span>
                <span>-₹ {formData.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border/40 pt-2">
              <span>CGST ({gstRate / 2}%)</span>
              <span>₹ {cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({gstRate / 2}%)</span>
              <span>₹ {sgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black border-t border-border pt-2 text-primary">
              <span>Estimated Invoice Total</span>
              <span>₹ {estimatedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting || !formData.bookingId} className="font-bold px-6">
          {submitting ? 'Generating...' : 'Generate Tax Invoice'}
        </Button>
      </div>
    </form>
  );
}
