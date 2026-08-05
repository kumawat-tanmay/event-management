'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { hrService, Staff, Vehicle } from '@/lib/services/hr.services';
import { expenseService, ExpenseInput } from '@/lib/services/expense.services';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

interface ExpenseFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isPageMode = !onClose;
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
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/finance/expenses');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record expense';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans text-foreground w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-bold">{t('finance.expenses.form.category')}</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          >
            <option value="Transport">Transport</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Staff Salary">Staff Salary</option>
            <option value="Vendor Purchase">Vendor Purchase</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-bold">{t('finance.expenses.form.amount')}</label>
          <input
            type="number"
            name="amount"
            value={formData.amount || ''}
            onChange={handleChange}
            placeholder="0.00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
            min="1"
          />
        </div>

        {/* Payment Mode */}
        <div className="space-y-2">
          <label className="text-sm font-bold">{t('finance.expenses.form.paymentMode')}</label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            required
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Reference Model */}
        <div className="space-y-2">
          <label className="text-sm font-bold">{t('finance.expenses.form.referenceType')}</label>
          <select
            name="refModel"
            value={formData.refModel}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Other">Operational / General</option>
            <option value="Booking">Event Booking</option>
            <option value="Staff">Staff Member</option>
            <option value="Vehicle">Vehicle Fleet</option>
          </select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-bold">{t('finance.expenses.form.date')}</label>
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
        <label className="text-sm font-bold">{t('finance.expenses.form.notes')}</label>
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
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose || (() => router.push('/finance/expenses'))} 
          disabled={submitting}
        >
          {t('finance.expenses.form.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="font-bold px-6">
          {submitting ? 'Saving...' : t('finance.expenses.form.submit')}
        </Button>
      </div>
    </form>
  );

  if (isPageMode) {
    return (
      <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 max-w-full">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{t('finance.expenses.form.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('finance.expenses.form.subtitle')}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 w-full">
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
}
