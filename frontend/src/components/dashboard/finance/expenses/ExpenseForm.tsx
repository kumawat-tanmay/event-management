'use client';

import React, { useState, useEffect } from 'react';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { hrService, Staff, Vehicle } from '@/lib/services/hr.services';
import { expenseService, ExpenseInput } from '@/lib/services/expense.services';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';

interface ExpenseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [formData, setFormData] = useState<ExpenseInput>({
    category: 'Other',
    amount: 0,
    paymentMode: 'Cash',
    refModel: 'Other',
    referenceId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Load Bookings, Staff, and Vehicles for reference dropdowns
  useEffect(() => {
    bookingService.getBookings({ limit: 100 })
      .then(res => setBookings(res.data || []))
      .catch(err => console.error('Error fetching bookings:', err));

    hrService.getStaff()
      .then(data => setStaffList(data || []))
      .catch(err => console.error('Error fetching staff list:', err));

    hrService.getVehicles()
      .then(data => setVehicles(data || []))
      .catch(err => console.error('Error fetching vehicles list:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: name === 'amount' ? Number(value) : value };
      
      // Reset referenceId if refModel changes
      if (name === 'refModel') {
        updated.referenceId = '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      return toast.error('Please enter a valid expense amount');
    }

    setSubmitting(true);
    try {
      // Clean up referenceId if refModel is 'Other' / operational
      const payload = { ...formData };
      if (payload.refModel === 'Other') {
        payload.referenceId = undefined;
      }

      await expenseService.createExpense(payload);
      toast.success('Expense recorded successfully');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record expense';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Transport">Transport / Diesel</option>
            <option value="Material Purchase">Material Purchase</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Staff Salary">Staff Wages / Salary</option>
            <option value="Other">Other Expenses</option>
          </select>
        </div>

        {/* Payment Mode */}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reference Type */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Expense Link (Reference Type)</label>
          <select
            name="refModel"
            value={formData.refModel}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Other">None (General Operational)</option>
            <option value="Booking">Event Booking</option>
            <option value="Staff">Staff Member</option>
            <option value="Vehicle">Vehicle Fleet</option>
          </select>
        </div>

        {/* Reference Selection */}
        {formData.refModel !== 'Other' && (
          <div className="space-y-2">
            <label className="text-sm font-bold">Select {formData.refModel}</label>
            <select
              name="referenceId"
              value={formData.referenceId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            >
              <option value="">-- Choose {formData.refModel} --</option>
              
              {formData.refModel === 'Booking' && bookings.map(b => (
                <option key={b._id} value={b._id}>
                  {b.bookingId} - {b.eventTitle}
                </option>
              ))}

              {formData.refModel === 'Staff' && staffList.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role})
                </option>
              ))}

              {formData.refModel === 'Vehicle' && vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.plateNumber})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Expense Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount || ''}
            onChange={handleChange}
            placeholder="e.g. 1500"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Date of Expense</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          />
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
          placeholder="e.g. Diesel for RJ-14 transport, Labour daily wages paid..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="font-bold px-6">
          {submitting ? 'Saving...' : 'Log Expense'}
        </Button>
      </div>
    </form>
  );
}
