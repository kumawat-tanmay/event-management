import { Quotation } from '../lib/services/quotation.services';
import { Booking } from '../lib/services/booking.services';

export const getQuotationPdfHtml = (qtn: Quotation | any): string => {
  const start = new Date(qtn.eventStartDate);
  const end = new Date(qtn.eventEndDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const itemsTotal = qtn.subtotal || 0;
  const transport = qtn.transportCharges || 0;
  const labour = qtn.labourCharges || 0;
  const combinedSubtotal = (qtn.subtotal || 0) + transport + labour;
  const discountAmt = (combinedSubtotal * (qtn.discount || 0)) / 100;
  const taxable = combinedSubtotal - discountAmt;

  const itemsRows = (qtn.items || []).map((item: any, idx: number) => {
    const itemObj = typeof item.item === 'object' ? item.item : null;
    const name = item.itemName || itemObj?.name || 'Unknown Item';
    const code = item.itemCode || itemObj?.code || '—';
    const qty = item.quantity || 0;

    return `
      <tr>
        <td style="text-align: center; padding: 9px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${idx + 1}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <strong style="color: #0f172a; display: block;">${name}</strong>
          <span style="font-size: 10px; color: #64748b; font-family: monospace;">Code: ${code}</span>
        </td>
        <td style="text-align: center; padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #0f172a;">${qty} ${item.unit || 'pc'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="pdf-wrapper">
      <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
          .a4-container { width: 794px; min-height: 1123px; background-color: #ffffff; padding: 20px 30px; margin: 0; }
          .brand-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .company-name { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; }
          .company-info { font-size: 11px; color: #475569; margin-top: 2px; }
          .doc-badge { text-align: right; }
          .doc-title { font-size: 22px; font-weight: 900; color: #ea580c; margin: 0; letter-spacing: 0.5px; }
          .qtn-no { font-size: 14px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 4px; }
          .info-grid { display: flex; gap: 16px; margin-bottom: 20px; }
          .info-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
          .info-card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          .info-card-text { font-size: 12px; color: #1e293b; margin: 3px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
          .items-table th { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; }
          .financial-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-top: 15px; }
          .terms-box { flex: 1.2; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .terms-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; }
          .terms-list { margin: 0; padding-left: 16px; color: #475569; font-size: 10.5px; }
          .terms-list li { margin-bottom: 4px; }
          .ledger-box { width: 280px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; }
          .ledger-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 11.5px; color: #334155; border-bottom: 1px solid #f1f5f9; }
          .ledger-row.subtotal { font-weight: 700; color: #0f172a; background: #f8fafc; }
          .ledger-row.grand-total { font-size: 14px; font-weight: 900; color: #0f172a; background: #ffedd5; border-top: 2px solid #ea580c; padding: 10px 12px; }
          .signature-container { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 15px; }
          .sig-block { width: 200px; text-align: center; border-top: 1.5px dashed #64748b; padding-top: 6px; font-size: 11px; font-weight: 700; color: #334155; }
        </style>
      <div class="a4-container">
        <div class="brand-header">
            <div>
              <h1 class="company-name">KRISHNA TENT & EVENTS</h1>
              <div class="company-info">123 Industrial Area, Jaipur, Rajasthan | Phone: +91 98290 12345</div>
              <div class="company-info">GSTIN: 08AABCD1234E1Z5 | Email: info@krishnaevents.com</div>
            </div>
            <div class="doc-badge">
              <h2 class="doc-title">QUOTATION</h2>
              <div class="qtn-no"># ${qtn.quotationId}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Date: <strong>${new Date(qtn.createdAt || Date.now()).toLocaleDateString()}</strong>
              </div>
              ${qtn.validUntil ? `<div style="font-size: 11px; color: #64748b;">Valid Until: <strong>${new Date(qtn.validUntil).toLocaleDateString()}</strong></div>` : ''}
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-card-title">CUSTOMER DETAILS</div>
              <div class="info-card-text"><strong>${qtn.customer?.name || '—'}</strong></div>
              <div class="info-card-text">Phone: ${qtn.customer?.phone || '—'}</div>
              ${qtn.customer?.email ? `<div class="info-card-text">Email: ${qtn.customer.email}</div>` : ''}
              ${qtn.customer?.address ? `<div class="info-card-text">Address: ${qtn.customer.address}</div>` : ''}
            </div>
            <div class="info-card">
              <div class="info-card-title">EVENT & VENUE SPECS</div>
              <div class="info-card-text">Title: <strong>${qtn.eventTitle}</strong></div>
              <div class="info-card-text">Event Type: ${qtn.eventType}</div>
              <div class="info-card-text">Duration: ${new Date(qtn.eventStartDate).toLocaleDateString()} to ${new Date(qtn.eventEndDate).toLocaleDateString()} (${durationDays} Days)</div>
              <div class="info-card-text">Venue: ${qtn.venueAddress}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="text-align: left;">Item Description</th>
                <th style="width: 100px; text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="financial-section">
            <div class="terms-box">
              <div class="terms-title">TERMS & CONDITIONS</div>
              <ol class="terms-list">
                <li>50% advance payment required to confirm booking and lock items.</li>
                <li>Any loss or damage to rental inventory will be billed at replacement cost.</li>
                <li>Transport and labour charges are estimates subject to site conditions.</li>
                <li>This quotation is valid for 5 days from the date of issue.</li>
              </ol>
            </div>

            <div class="ledger-box">
              ${itemsTotal > 0 ? `
                <div class="ledger-row">
                  <span>Materials Total:</span>
                  <span>₹ ${itemsTotal.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="ledger-row">
                <span>Transport / Car Cost:</span>
                <span>₹ ${transport.toLocaleString()}</span>
              </div>
              <div class="ledger-row">
                <span>Tent Cost:</span>
                <span>₹ ${labour.toLocaleString()}</span>
              </div>
              <div class="ledger-row subtotal">
                <span>Subtotal:</span>
                <span>₹ ${combinedSubtotal.toLocaleString()}</span>
              </div>
              ${qtn.discount > 0 ? `
                <div class="ledger-row" style="color: #16a34a;">
                  <span>Discount (${qtn.discount}%):</span>
                  <span>- ₹ ${discountAmt.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="ledger-row">
                <span>Taxable Amount:</span>
                <span>₹ ${taxable.toLocaleString()}</span>
              </div>
              <div class="ledger-row">
                <span>GST (${qtn.taxRate || 0}%):</span>
                <span>₹ ${(qtn.taxAmount || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-row grand-total">
                <span>GRAND TOTAL:</span>
                <span>₹ ${(qtn.grandTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="signature-container">
            <div class="sig-block">Customer Acceptance Signature</div>
            <div class="sig-block">Authorized Signatory (Krishna Events)</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getBookingAgreementPdfHtml = (booking: Booking | any): string => {
  const start = new Date(booking.eventStartDate);
  const end = new Date(booking.eventEndDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const itemsRows = (booking.items || []).map((item: any, idx: number) => {
    const itemObj = typeof item.item === 'object' ? item.item : null;
    const name = item.itemName || itemObj?.name || 'Unknown Item';
    const code = item.itemCode || itemObj?.code || '—';
    const qty = item.quantity || 0;

    return `
      <tr>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #4b5563;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          <strong style="color: #111827; display: block; font-size: 13px;">${name}</strong>
          <span style="font-size: 10px; color: #6b7280; font-family: monospace;">${code}</span>
        </td>
        <td style="text-align: center; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #111827;">${qty} ${item.unit || 'pc'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="pdf-wrapper">
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif; color: #111827; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
          .a4-container { width: 794px; min-height: 1123px; background-color: #ffffff; padding: 20px 30px; margin: 0; }
          .text-center { text-align: center; }
          .border-b-2 { border-bottom: 2px solid #1f2937; }
          .pb-6 { padding-bottom: 24px; }
          .mb-8 { margin-bottom: 32px; }
          .h1-title { font-size: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #111827; font-family: sans-serif; margin: 0; }
          .subtitle { font-size: 12px; font-family: sans-serif; color: #6b7280; margin-top: 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
          .address { font-size: 12px; color: #4b5563; margin-top: 4px; }
          .header-row { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; font-family: sans-serif; }
          .agreement-title { font-size: 18px; font-weight: 700; text-transform: uppercase; color: #030712; margin: 0; }
          .header-right { text-align: right; font-weight: 600; color: #4b5563; }
          .grid-2 { display: flex; gap: 24px; margin-bottom: 32px; font-size: 12px; font-family: sans-serif; }
          .card { flex: 1; border: 1px solid #f3f4f6; padding: 16px; border-radius: 8px; background: #f9fafb; }
          .card-title { font-weight: 900; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; font-size: 11px; }
          .card p { margin: 2px 0; color: #4b5563; }
          .card .bold { font-weight: 700; color: #030712; }
          .section-title { font-size: 14px; font-family: sans-serif; font-weight: 900; text-transform: uppercase; color: #374151; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .table { width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 32px; }
          .table th { border-bottom: 1px solid #9ca3af; color: #374151; font-weight: 700; text-transform: uppercase; padding: 8px 0; font-size: 11px; }
          .ledger-container { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .ledger { width: 380px; font-size: 12px; font-family: sans-serif; border-top: 1px solid #9ca3af; padding-top: 16px; }
          .ledger-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #4b5563; }
          .ledger-row .val { font-weight: 600; color: #030712; }
          .ledger-total { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 14px; font-weight: 900; color: #030712; margin-top: 4px; }
          .ledger-adv { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 4px; font-weight: 700; color: #047857; margin-top: 4px; }
          .ledger-bal { display: flex; justify-content: space-between; border-top: 2px solid #111827; padding-top: 8px; font-size: 14px; font-weight: 900; color: #030712; margin-top: 8px; }
          .terms { border-top: 1px solid #d1d5db; padding-top: 24px; margin-bottom: 48px; font-size: 11.5px; color: #4b5563; font-family: sans-serif; }
          .terms-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #1f2937; display: flex; align-items: center; margin-bottom: 12px; }
          .terms ol { margin: 0; padding-left: 16px; }
          .terms li { margin-bottom: 8px; }
          .signatures { display: flex; justify-content: space-between; text-align: center; font-size: 12px; font-family: sans-serif; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; }
          .sig-box { width: 45%; }
          .sig-line { height: 64px; border-bottom: 1px solid #9ca3af; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; }
          .sig-name { font-weight: 700; color: #111827; margin-top: 8px; margin-bottom: 0; }
          .sig-role { color: #6b7280; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; margin-top: 2px; }
          .signed-text { color: #047857; font-weight: 700; font-style: italic; }
        </style>
      <div class="a4-container">
        <div class="text-center border-b-2 pb-6 mb-8">
            <h1 class="h1-title">KRISHNA TENT & EVENTS</h1>
            <p class="subtitle">PREMIUM EVENT INFRASTRUCTURE & RENTAL SERVICES</p>
            <p class="address">Jaipur Road, Rajasthan, India</p>
            
            <div class="header-row">
              <div>
                <h2 class="agreement-title">RENTAL AGREEMENT</h2>
              </div>
              <div class="header-right">
                <p style="margin:0;">Agreement No: <strong>${booking.bookingId}/AGR</strong></p>
                <p style="margin:0;">Date: ${new Date(booking.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3 class="card-title">SERVICE PROVIDER (LESSOR)</h3>
              <p class="bold">Krishna Tent & Events</p>
              <p>GSTIN: 08AAACK9988C1ZP</p>
              <p class="bold">Email: info@krishnaevents.com</p>
            </div>
            <div class="card">
              <h3 class="card-title">LESSEE / CLIENT</h3>
              <p class="bold">${booking.customer?.name || '—'}</p>
              <p class="bold">Phone: ${booking.customer?.phone || '—'}</p>
              ${booking.customer?.email ? `<p>Email: ${booking.customer.email}</p>` : ''}
            </div>
          </div>

          <div class="grid-2" style="background:#f9fafb; border:1px solid #e5e7eb; padding:16px; border-radius:8px; margin-bottom:32px;">
            <div style="flex:1;">
              <span class="card-title" style="border:none; display:block;">VENUE / EVENT ADDRESS</span>
              <p class="bold" style="margin-top:4px;">${booking.venueAddress}</p>
            </div>
            <div style="flex:1;">
              <span class="card-title" style="border:none; display:block;">RENTAL DURATION</span>
              <p class="bold" style="margin-top:4px;">${new Date(booking.eventStartDate).toLocaleDateString()} to ${new Date(booking.eventEndDate).toLocaleDateString()} (${durationDays} Days)</p>
            </div>
          </div>

          <div>
            <h3 class="section-title">BOOKED MATERIALS & INFRASTRUCTURE</h3>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>ITEM DETAILS</th>
                  <th style="text-align: center; width: 100px;">QTY</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <div class="ledger-container">
            <div class="ledger">
              <div class="ledger-row">
                <span>Subtotal Amount:</span>
                <span class="val">₹${(booking.subtotal || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-row">
                <span>Transport / Car Cost:</span>
                <span class="val">₹${(booking.transportCharges || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-row">
                <span>Tent Cost:</span>
                <span class="val">₹${(booking.labourCharges || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-row">
                <span>GST (${booking.taxRate || 0}%):</span>
                <span class="val">₹${(booking.taxAmount || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-total">
                <span>Grand Total:</span>
                <span>₹${(booking.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-adv">
                <span>Advance Paid:</span>
                <span>- ₹${(booking.advancePaid || 0).toLocaleString()}</span>
              </div>
              <div class="ledger-bal">
                <span>Balance Due Amount:</span>
                <span>₹${(booking.balanceAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="terms">
            <h4 class="terms-title">TERMS & CONDITIONS</h4>
            <ol>
              <li><strong>Loss or Damage:</strong> Client is fully responsible for any loss, damage, or theft of the rented materials (tents, chairs, carpets, decor) during the possession duration. Any replacements will be charged at purchase cost.</li>
              <li><strong>Payment Schedule:</strong> 50% advance payment is required to lock the booking. The remaining balance must be cleared before the dispatch of materials from the warehouse.</li>
              <li><strong>Cancellation:</strong> Bookings cancelled within 7 days of the event are subject to a 20% cancellation fee on the total booking amount.</li>
            </ol>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line">
                ${booking.agreementSigned ? `<span class="signed-text">Electronically Signed</span>` : `<span style="color:#9ca3af; font-style:italic;">Client Signature</span>`}
              </div>
              <p class="sig-name">${booking.customer?.name || '—'}</p>
              <p class="sig-role">LESSEE SIGNATURE</p>
            </div>
            <div class="sig-box">
              <div class="sig-line">
                ${booking.agreementSigned ? `<span class="signed-text">Authorized Signatory</span>` : `<span style="color:#9ca3af; font-style:italic;">For Krishna Tent & Events</span>`}
              </div>
              <p class="sig-name">Authorized Signatory</p>
              <p class="sig-role">LESSOR SIGNATURE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
