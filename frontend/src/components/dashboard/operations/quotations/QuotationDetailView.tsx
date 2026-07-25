'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, Edit, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';

export function QuotationDetailView() {
  const router = useRouter();

  // Dummy Quotation Data
  const quotation = {
    id: 'QT-2026-001',
    date: '2026-10-10',
    validUntil: '2026-10-14',
    status: 'Sent',
    customer: {
      name: 'Royal Weddings Agency',
      address: '123 Event Planner Hub, Jaipur',
      phone: '+91 9829054321',
      gstin: '08AAAAA0000A1Z5',
    },
    eventDetails: {
      startDate: '2026-10-15',
      endDate: '2026-10-18',
      type: 'Ready-Made Package',
    },
    items: [
      { id: 1, name: 'White Pagoda Tent 10x10', code: 'TENT-WHT-01', rate: 2500, qty: 2, total: 5000 },
      { id: 2, name: 'White VIP Sofa', code: 'SOFA-WHT-01', rate: 800, qty: 5, total: 4000 },
      { id: 3, name: 'Round Table 5ft', code: 'TBL-RND-01', rate: 150, qty: 10, total: 1500 },
      { id: 4, name: 'P4 LED Screen', code: 'LED-P4-001', rate: 150, qty: 200, total: 30000 },
    ],
    summary: {
      itemsTotal: 40500,
      transportCharge: 5000,
      labourCharge: 3500,
      subTotal: 49000,
      discountPercent: 10,
      discountAmount: 4900,
      taxableAmount: 44100,
      gst: 7938,
      grandTotal: 52038,
    }
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Quotation #{quotation.id}</h2>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Generated on {quotation.date}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/operations/quotations/${quotation.id}/edit`)}
            disabled={quotation.status === 'Converted'}
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="primary" className="flex items-center gap-2" disabled={quotation.status === 'Converted'}>
            <CheckCircle className="w-4 h-4" />
            Convert to Booking
          </Button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div className="bg-card border border-border shadow-sm rounded-xl p-8 max-w-4xl w-full mx-auto">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-border pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-primary mb-1">Krishna Tent & Events</h1>
            <p className="text-sm text-muted-foreground">123 Industrial Area, Jaipur, Rajasthan</p>
            <p className="text-sm text-muted-foreground">GSTIN: 08AABCD1234E1Z5</p>
            <p className="text-sm text-muted-foreground">Phone: +91 98290 12345</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-foreground mb-2">QUOTATION</h2>
            <div className="text-sm">
              <span className="text-muted-foreground inline-block w-24">Quote No:</span>
              <span className="font-bold">{quotation.id}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground inline-block w-24">Date:</span>
              <span className="font-bold">{quotation.date}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground inline-block w-24">Valid Until:</span>
              <span className="font-bold">{quotation.validUntil}</span>
            </div>
          </div>
        </div>

        {/* Customer & Event Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Quotation To</h3>
            <p className="font-bold text-lg text-foreground">{quotation.customer.name}</p>
            <p className="text-sm text-muted-foreground">{quotation.customer.address}</p>
            <p className="text-sm text-muted-foreground">Ph: {quotation.customer.phone}</p>
            {quotation.customer.gstin && (
              <p className="text-sm text-muted-foreground">GSTIN: {quotation.customer.gstin}</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Event Details</h3>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-bold">{quotation.eventDetails.startDate}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-bold">{quotation.eventDetails.endDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package Type:</span>
                <span className="font-bold">{quotation.eventDetails.type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-on-primary">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg font-bold">#</th>
                <th className="px-4 py-3 font-bold">Item Description</th>
                <th className="px-4 py-3 font-bold text-center">Rate/Day</th>
                <th className="px-4 py-3 font-bold text-center">Qty</th>
                <th className="px-4 py-3 font-bold text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-center">₹ {item.rate}</td>
                  <td className="px-4 py-3 text-center font-bold">{item.qty}</td>
                  <td className="px-4 py-3 text-right font-bold">₹ {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items Total:</span>
              <span className="font-bold">₹ {quotation.summary.itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transport Charges:</span>
              <span className="font-bold">₹ {quotation.summary.transportCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labour Charges:</span>
              <span className="font-bold">₹ {quotation.summary.labourCharge.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="font-bold">Sub Total:</span>
              <span className="font-bold">₹ {quotation.summary.subTotal.toLocaleString()}</span>
            </div>
            {quotation.summary.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({quotation.summary.discountPercent}%):</span>
                <span className="font-bold">- ₹ {quotation.summary.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxable Amount:</span>
              <span className="font-bold">₹ {quotation.summary.taxableAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%):</span>
              <span className="font-bold">₹ {quotation.summary.gst.toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-primary mt-2 pt-3 flex justify-between">
              <span className="text-lg font-black text-foreground">Grand Total:</span>
              <span className="text-xl font-black text-primary">₹ {quotation.summary.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-border pt-6 mt-8">
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Terms & Conditions
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>50% advance payment required to confirm booking and reserve items.</li>
            <li>Any damage to rental items will be charged to the customer at replacement cost.</li>
            <li>Transport and labour charges are estimates and may vary based on actual on-site conditions.</li>
            <li>Quotation is valid for 5 days from the date of issue.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
