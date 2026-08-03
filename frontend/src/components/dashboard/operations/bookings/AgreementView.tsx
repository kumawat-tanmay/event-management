'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Printer, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { bookingService, Booking } from '@/lib/services/booking.services';

export function AgreementView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [signing, setSigning] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking for agreement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSign = async () => {
    if (!booking) return;
    try {
      setSigning(true);
      await bookingService.signAgreement(booking._id);
      await fetchBooking();
    } catch (error) {
      console.error('Error signing agreement:', error);
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;
  if (!booking) return <div className="p-8 text-center text-error">Booking data not found.</div>;

  const start = new Date(booking.eventStartDate);
  const end = new Date(booking.eventEndDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const itemsTotal = booking.subtotal || 0;

  // Clean English text helper
  const getBilingualText = (key: string) => {
    return t(key, { lng: 'en' });
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      {/* Top action bar, centered with the document */}
      <div className="flex items-center justify-between gap-4 mb-6 max-w-4xl w-full mx-auto print:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="shrink-0 text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2">
          {!booking.agreementSigned && (
            <Button 
              variant="primary" 
              onClick={handleSign} 
              disabled={signing}
              className="flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {signing ? 'Signing...' : 'Sign Agreement'}
            </Button>
          )}
          {booking.agreementSigned && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-bold border border-success/30">
              <ShieldCheck className="w-4 h-4" />
              {getBilingualText('bookings.electronicallySigned')} ({new Date(booking.agreementSignedAt || '').toLocaleDateString()})
            </span>
          )}
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            {t('bookings.printAgreement')}
          </Button>
        </div>
      </div>

      {/* A4 Document Container centered on screen */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl p-8 md:p-12 max-w-4xl w-full mx-auto print:border-0 print:shadow-none print:p-0 font-serif leading-relaxed">
        
        {/* Header - Centered company header */}
        <div className="flex flex-col items-center text-center border-b-2 border-gray-800 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 font-sans">KRISHNA TENT & EVENTS</h1>
          <p className="text-xs font-sans text-gray-500 mt-1 uppercase tracking-wider font-bold">
            {getBilingualText('bookings.premiumServices')}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {getBilingualText('bookings.jaipurRoad')}
          </p>
          
          <div className="w-full flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 text-xs font-sans">
            <div className="text-center sm:text-left mb-2 sm:mb-0">
              <h2 className="text-lg font-bold uppercase text-gray-950">{getBilingualText('bookings.agreementTitle')}</h2>
            </div>
            <div className="text-center sm:text-right font-semibold">
              <p className="text-gray-600">
                {getBilingualText('bookings.agreementNo')}: <strong>{booking.bookingId}/AGR</strong>
              </p>
              <p className="text-gray-600">
                {getBilingualText('bookings.dateLabel')}: {new Date(booking.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Parties involved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs font-sans">
          <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/55">
            <h3 className="font-black uppercase text-gray-500 border-b pb-1 mb-2">
              {getBilingualText('bookings.serviceProvider')}
            </h3>
            <p className="font-bold text-gray-950">Krishna Tent & Events</p>
            <p className="text-gray-600 mt-0.5">GSTIN: 08AAACK9988C1ZP</p>
            <p className="text-gray-600 font-semibold">Email: info@krishnaevents.com</p>
          </div>
          <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/55">
            <h3 className="font-black uppercase text-gray-500 border-b pb-1 mb-2">
              {getBilingualText('bookings.lesseeClient')}
            </h3>
            <p className="font-bold text-gray-950">{booking.customer?.name || '—'}</p>
            <p className="text-gray-600 mt-0.5 font-semibold">
              {getBilingualText('bookings.phoneLabel')}: {booking.customer?.phone || '—'}
            </p>
            {booking.customer?.email && (
              <p className="text-gray-600">
                {getBilingualText('bookings.emailLabel')}: {booking.customer.email}
              </p>
            )}
          </div>
        </div>

        {/* Booking parameters */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-xs font-sans grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 font-bold uppercase block">{getBilingualText('bookings.venueAddress')}</span>
            <p className="text-gray-900 font-semibold mt-1">{booking.venueAddress}</p>
          </div>
          <div>
            <span className="text-gray-500 font-bold uppercase block">{getBilingualText('bookings.rentalDuration')}</span>
            <p className="text-gray-900 font-semibold mt-1">
              {new Date(booking.eventStartDate).toLocaleDateString()} to {new Date(booking.eventEndDate).toLocaleDateString()} ({duration} Days)
            </p>
          </div>
        </div>

        {/* Booked inventory */}
        <div className="mb-8">
          <h3 className="text-sm font-sans font-black uppercase text-gray-700 mb-3 border-b pb-1">
            {getBilingualText('bookings.bookedMaterialsHeader')}
          </h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-400 text-gray-700 font-bold uppercase">
                <th className="py-2">{getBilingualText('bookings.itemDetailsLabel')}</th>
                <th className="py-2 text-center">{getBilingualText('bookings.qtyLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-900">
              {booking.items.map((item: any, idx: number) => {
                const itemObj = typeof item.item === 'object' ? item.item : null;
                const name = item.itemName || (itemObj as any)?.name || 'Unknown Item';
                const code = item.itemCode || (itemObj as any)?.code || '—';
                const qty = item.quantity || 0;

                return (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold">
                      {name}
                      <span className="text-[10px] text-gray-500 font-normal block font-mono">{code}</span>
                    </td>
                    <td className="py-2.5 text-center font-semibold">{qty} {item.unit || 'pc'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Commercial details */}
        <div className="flex justify-end mb-10">
          <div className="w-full sm:w-[380px] text-xs font-sans space-y-2 border-t border-gray-400 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">{getBilingualText('bookings.subtotalAmountLabel')}:</span>
              <span className="font-semibold text-gray-950">₹{(booking.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{getBilingualText('bookings.transportChargesLabel')}:</span>
              <span className="font-semibold text-gray-950">₹{(booking.transportCharges || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{getBilingualText('bookings.labourChargesLabel')}:</span>
              <span className="font-semibold text-gray-950">₹{(booking.labourCharges || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{getBilingualText('bookings.gstLabel')} ({booking.taxRate || 0}%):</span>
              <span className="font-semibold text-gray-950">₹{(booking.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-950">
              <span>{getBilingualText('bookings.grandTotalLabel')}:</span>
              <span>₹{(booking.grandTotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold border-t border-gray-200 pt-1">
              <span>{getBilingualText('bookings.advancePaidLabel')}:</span>
              <span>- ₹{(booking.advancePaid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-sm font-black text-gray-950">
              <span>{getBilingualText('bookings.balanceDueLabel')}:</span>
              <span>₹{(booking.balanceAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="border-t border-gray-300 pt-6 mb-12 text-xs text-gray-600 space-y-3 font-sans leading-relaxed">
          <h4 className="text-xs font-black uppercase text-gray-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {getBilingualText('bookings.termsAndConditionsLabel')}
          </h4>
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              <strong>Loss or Damage:</strong> Client is fully responsible for any loss, damage, or theft of the rented materials (tents, chairs, carpets, decor) during the possession duration. Any replacements will be charged at purchase cost.
            </li>
            <li>
              <strong>Payment Schedule:</strong> 50% advance payment is required to lock the booking. The remaining balance must be cleared before the dispatch of materials from the warehouse.
            </li>
            <li>
              <strong>Cancellation:</strong> Bookings cancelled within 7 days of the event are subject to a 20% cancellation fee on the total booking amount.
            </li>
          </ol>
        </div>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs font-sans pt-10 border-t border-dashed border-gray-300">
          <div>
            <div className="h-16 border-b border-gray-400 flex items-end justify-center pb-1">
              {booking.agreementSigned ? (
                <span className="text-success font-bold italic">{getBilingualText('bookings.electronicallySigned')}</span>
              ) : (
                <span className="text-gray-400 italic">{getBilingualText('bookings.clientSignatureLabel')}</span>
              )}
            </div>
            <p className="font-bold text-gray-900 mt-2">{booking.customer?.name || '—'}</p>
            <p className="text-gray-500 uppercase text-[9px] font-black tracking-wider">
              {getBilingualText('bookings.lesseeSignatureLabel')}
            </p>
          </div>
          <div>
            <div className="h-16 border-b border-gray-400 flex items-end justify-center pb-1">
              {booking.agreementSigned ? (
                <span className="text-success font-bold italic">{getBilingualText('bookings.authorizedSignatoryLabel')}</span>
              ) : (
                <span className="text-gray-400 italic">{getBilingualText('bookings.forCompanyLabel')}</span>
              )}
            </div>
            <p className="font-bold text-gray-900 mt-2">{getBilingualText('bookings.authorizedSignatoryLabel')}</p>
            <p className="text-gray-500 uppercase text-[9px] font-black tracking-wider">
              {getBilingualText('bookings.lessorSignatureLabel')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
