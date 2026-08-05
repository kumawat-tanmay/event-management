'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { bookingService, Booking } from '@/lib/services/booking.services';
import { invoiceService } from '@/lib/services/invoice.services';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface InvoiceBuilderProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function InvoiceBuilder({ onClose, onSuccess }: InvoiceBuilderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultBookingId = searchParams?.get('bookingId') || '';
  const isPageMode = !onClose;

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
        const list = res.data || [];
        setBookings(list);
        
        if (defaultBookingId) {
          const matched = list.find(b => b._id === defaultBookingId);
          if (matched) {
            setSelectedBooking(matched);
            setFormData(prev => ({
              ...prev,
              bookingId: defaultBookingId
            }));
          }
        }
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        toast.error('Failed to load active bookings list');
      });
  }, [defaultBookingId]);

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
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/finance/invoices');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate tax invoice';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate taxes on change for preview (including transport and labour costs as part of billing base)
  const subtotal = selectedBooking?.subtotal || 0;
  const transport = selectedBooking?.transportCharges || 0;
  const labour = selectedBooking?.labourCharges || 0;
  const grossTotal = subtotal + transport + labour;
  const discount = formData.discount || 0;
  const taxableAmount = Math.max(0, grossTotal - discount);
  const gstTax = Math.round(taxableAmount * 0.18);
  const grandTotal = taxableAmount + gstTax;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 font-sans text-foreground w-full">
      <div className="space-y-2">
        <label className="text-sm font-bold">{t('finance.invoices.builder.selectBooking')}</label>
        <select
          name="bookingId"
          value={formData.bookingId}
          onChange={handleBookingChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          required
        >
          <option value="">-- Choose Event Booking --</option>
          {bookings.map(b => (
            <option key={b._id} value={b._id}>
              {b.bookingId} - {b.eventTitle} ({b.customer?.name})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold">{t('finance.invoices.builder.discount')}</label>
        <input
          type="number"
          name="discount"
          value={formData.discount || ''}
          onChange={handleChange}
          placeholder="0.00"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          min="0"
        />
      </div>

      {/* Tax Breakdown Preview Card */}
      {selectedBooking && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
            {t('finance.invoices.builder.taxPreview')}
          </h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items Subtotal:</span>
            <span className="font-medium">₹{subtotal.toLocaleString()}</span>
          </div>
          {(transport > 0 || labour > 0) && (
            <div className="flex justify-between text-muted-foreground">
              <span>Logistics & Labour:</span>
              <span>₹{(transport + labour).toLocaleString()}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-success font-medium">
              <span>Discount Applied:</span>
              <span>-₹{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable Value:</span>
            <span className="font-semibold">₹{taxableAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST (18% SGST+CGST):</span>
            <span>+₹{gstTax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-black text-foreground pt-2 border-t border-border/60">
            <span>Grand Invoice Total:</span>
            <span className="text-primary">₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose || (() => router.push('/finance/invoices'))} 
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="font-bold px-6">
          {submitting ? 'Generating...' : t('finance.invoices.builder.generate')}
        </Button>
      </div>
    </form>
  );

  if (isPageMode) {
    return (
      <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 max-w-full animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{t('finance.invoices.builder.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('finance.invoices.builder.subtitle')}</p>
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
