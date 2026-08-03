'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { paymentService, PaymentInput } from '@/lib/services/payment.services';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentForm({ onClose, onSuccess }: PaymentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const [formData, setFormData] = useState<PaymentInput>({
    bookingId: '',
    amount: 0,
    paymentType: 'advance',
    paymentMode: 'Cash',
    transactionId: '',
    notes: '',
    transactionDate: new Date().toISOString().split('T')[0]
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
      // Default amount to remaining balance if booking is selected
      amount: booking ? booking.balanceAmount : 0
    }));
  };

  const handleAutoGenerateTxnId = () => {
    const modePrefix = (formData.paymentMode || 'CASH').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'TXN';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const generated = `${modePrefix}-${dateStr}-${randomCode}`;
    setFormData(prev => ({ ...prev, transactionId: generated }));
    toast.success(`Generated ID: ${generated}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      return toast.error('Please enter a valid payment amount');
    }

    setSubmitting(true);
    try {
      const payload: PaymentInput = {
        ...formData,
        bookingId: formData.bookingId || undefined,
        customerId: formData.customerId || undefined
      };
      await paymentService.createPayment(payload);
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record payment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Select Event Booking</label>
          <select
            name="bookingId"
            value={formData.bookingId}
            onChange={handleBookingChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">-- Direct Customer Payment (No Booking) --</option>
            {bookings.map(b => (
              <option key={b._id} value={b._id}>
                {b.bookingId} - {b.eventTitle} ({b.customer?.name || 'Walk-in'})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Type */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Payment Type</label>
          <select
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="advance">Advance Payment (अग्रिम भुगतान)</option>
            <option value="final">Final Settlement (अंतिम चुकता)</option>
            <option value="security_deposit">Security Deposit / Guarantee (सिक्योरिटी जमा)</option>
            <option value="security_refund">Security Refund (सिक्योरिटी वापसी)</option>
            <option value="refund">General Refund (रिफंड)</option>
          </select>
        </div>
      </div>

      {/* Booking Ledger Info Card */}
      {selectedBooking && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Grand Total</p>
            <p className="text-base font-black">₹ {selectedBooking.grandTotal.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid So Far</p>
            <p className="text-base font-black text-success">₹ {selectedBooking.advancePaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining Dues</p>
            <p className="text-base font-black text-error">₹ {selectedBooking.balanceAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Payment Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount || ''}
            onChange={handleChange}
            placeholder="e.g. 5000"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Transaction Date</label>
          <input
            type="date"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Payment Mode</label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI (PhonePe/GPay/Paytm)</option>
            <option value="Bank Transfer">Net Banking / NEFT</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Reference/Transaction ID */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold">Transaction ID / Reference #</label>
            <button
              type="button"
              onClick={handleAutoGenerateTxnId}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Auto Generate
            </button>
          </div>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            placeholder="e.g. UPI Ref, Cheque Number (or Auto-generated)"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <p className="text-[11px] text-muted-foreground">Leave blank to auto-generate unique ID on submit</p>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Remarks / Internal Notes (Optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="e.g. Received partial advance, cheque clearance details..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="font-bold px-6">
          {submitting ? 'Recording...' : 'Record Transaction'}
        </Button>
      </div>
    </form>
  );
}
