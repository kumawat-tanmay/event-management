'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Download, FileText, Eye, Edit, Trash2, Search, CheckCircle, Clock, CalendarDays, FileCheck, IndianRupee, MessageSquare } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { quotationService, Quotation, QuotationStats } from '@/lib/services/quotation.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { generatePdfFromHtml, sharePdfViaWhatsApp } from '@/utils/pdfShare';
import { getQuotationPdfHtml } from '@/utils/pdfTemplates';

const STATUS_OPTIONS: Quotation['status'][] = ['Draft', 'Sent', 'Approved', 'Rejected'];

function StatusDropdown({ quotation, onStatusChange }: { quotation: any, onStatusChange: (id: string, status: Quotation['status']) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:opacity-80 transition-opacity">
        <StatusBadge status={quotation.status} />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="absolute z-50 top-full right-0 md:left-0 md:right-auto mt-1 w-36 bg-card border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
            {STATUS_OPTIONS.map(s => (
              <div 
                key={s} 
                onClick={() => { onStatusChange(quotation._id, s); setIsOpen(false); }}
                className="cursor-pointer hover:bg-muted p-1.5 rounded-lg transition-colors flex items-center justify-center relative z-10"
              >
                <StatusBadge status={s} className="w-full" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function QuotationsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<QuotationStats>({ total: 0, draft: 0, sent: 0, approved: 0, converted: 0, rejected: 0, totalValue: 0 });
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const tabs = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'CONVERTED'];
  const tabNavRef = React.useRef<HTMLDivElement>(null);
  const tabBtnRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const centerActiveTab = React.useCallback((tab: string) => {
    const container = tabNavRef.current;
    const target = tabBtnRefs.current[tab];
    if (container && target) {
      const scrollLeft = target.offsetLeft - (container.clientWidth / 2) + (target.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, []);

  React.useEffect(() => {
    if (activeTab) {
      const timer = setTimeout(() => {
        centerActiveTab(activeTab);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, centerActiveTab]);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotations({ limit: 200 });
      setData(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const filteredData = React.useMemo(() => {
    return data.filter(quote => {
      if (activeTab === 'DRAFT' && quote.status !== 'Draft') return false;
      if (activeTab === 'SENT' && quote.status !== 'Sent') return false;
      if (activeTab === 'APPROVED' && quote.status !== 'Approved') return false;
      if (activeTab === 'CONVERTED' && quote.status !== 'Converted') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const qId = (quote.quotationId || '').toLowerCase();
        const cust = (quote.customer?.name || '').toLowerCase();
        const title = (quote.eventTitle || '').toLowerCase();
        const venue = (quote.venueAddress || '').toLowerCase();
        return qId.includes(q) || cust.includes(q) || title.includes(q) || venue.includes(q);
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  const confirmDelete = async () => {
    if (quoteToDelete) {
      try {
        await quotationService.deleteQuotation(quoteToDelete);
        await fetchQuotations();
      } catch (error) {
        console.error('Error deleting quotation:', error);
      }
      setDeleteModalOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleSendWhatsApp = async (qtn: Quotation) => {
    const htmlContent = getQuotationPdfHtml(qtn);
    const filename = `Quotation_${qtn.quotationId}.pdf`;
    const customerPhone = qtn.customer?.phone || '';
    
    const message = `🏕️ *Krishna Tent & Events*

Dear ${qtn.customer?.name || 'Customer'},

Please find attached your *Quotation #${qtn.quotationId}* for the event:
📋 *${qtn.eventTitle}*
📅 ${new Date(qtn.eventStartDate).toLocaleDateString()} to ${new Date(qtn.eventEndDate).toLocaleDateString()}
📍 ${qtn.venueAddress}
💰 Grand Total: ₹${(qtn.grandTotal || 0).toLocaleString()}

This quotation is valid for 5 days. Please review and confirm.

Thank you!
📞 +91 98290 12345`;

    const blob = await generatePdfFromHtml(htmlContent, filename);
    if (blob) {
      await sharePdfViaWhatsApp(blob, filename, customerPhone, message);
    } else {
      alert("Failed to generate PDF");
    }
  };

  const columns = [
    { 
      header: t('quotation.quotationId'), 
      accessorKey: 'quotationId', 
      cell: (row: any) => (
        <span className="font-mono text-sm font-bold text-foreground whitespace-nowrap">
          {row.quotationId}
        </span>
      ) 
    },
    { 
      header: t('quotation.customer'), 
      accessorKey: 'customer', 
      cell: (row: any) => (
        <div className="whitespace-nowrap max-w-[150px] truncate" title={row.customer?.name}>
          <p className="font-bold text-foreground truncate">{row.customer?.name || '—'}</p>
          <span className="text-xs text-muted-foreground">{row.customer?.type === 'Retail' ? t('crm.retail') : t('crm.corporate')}</span>
        </div>
      ) 
    },
    { 
      header: t('quotation.dates'), 
      accessorKey: 'dates', 
      cell: (row: any) => (
        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(row.eventStartDate).toLocaleDateString()} - {new Date(row.eventEndDate).toLocaleDateString()}</span>
        </div>
      ) 
    },
    { 
      header: t('quotation.amount'), 
      accessorKey: 'grandTotal', 
      cell: (row: any) => (
        <span className="font-bold text-foreground whitespace-nowrap">
          ₹ {(row.grandTotal || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('quotation.status'), 
      accessorKey: 'status', 
      cell: (row: any) => {
        if (row.status === 'Converted') {
          return <StatusBadge status={row.status} />;
        }
        
        return (
          <StatusDropdown 
            quotation={row} 
            onStatusChange={async (id, newStatus) => {
              try {
                await quotationService.updateQuotation(id, { status: newStatus });
                // We assume fetchQuotations works via closure.
                fetchQuotations();
              } catch (error) {
                console.error('Failed to update status', error);
              }
            }} 
          />
        );
      }
    },
    {
      header: t('quotation.actions'), 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <Link href={`/operations/quotations/${row._id}`} title={t('quotation.viewQuotation')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleSendWhatsApp(row)}
            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Send to WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <ActionGuard permission="quotations.update">
            <Link href={`/operations/quotations/${row._id}/edit`} title={t('quotation.editQuotation')}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" disabled={row.status === 'Converted'}>
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>
          <ActionGuard permission="quotations.delete">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setQuoteToDelete(row._id);
                setDeleteModalOpen(true);
              }}
              disabled={row.status === 'Converted'}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
              title={t('crm.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('quotation.title')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('quotation.subtitle')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            {t('crm.download', 'Export')}
          </Button>
          <ActionGuard permission="quotations.create">
            <Link href="/operations/quotations/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('quotation.newQuotation')}</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('quotation.title')}
          value={stats.total}
          icon={FileText}
          colorTheme="primary"
        />
        <StatsCard
          title={t('crm.pending')}
          value={stats.draft + stats.sent}
          icon={Clock}
          colorTheme="warning"
        />
        <StatsCard
          title={t('quotation.converted')}
          value={stats.converted}
          icon={CheckCircle}
          colorTheme="success"
        />
        <StatsCard
          title={t('quotation.grandTotal')}
          value={`₹ ${(stats.totalValue / 100000).toFixed(2)}L`}
          icon={IndianRupee}
          colorTheme="blue"
        />
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <FileCheck className="w-5 h-5 text-primary" />
            {t('quotation.quotationDetails')}
          </div>
          
          <div
            ref={tabNavRef}
            className="relative flex items-center bg-muted/50 p-1.5 rounded-xl overflow-x-auto flex-nowrap max-w-full md:max-w-md lg:max-w-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                ref={(el) => {
                  tabBtnRefs.current[tab] = el;
                }}
                onClick={() => {
                  setActiveTab(tab);
                  centerActiveTab(tab);
                }}
                className={`px-4 py-1.5 text-xs font-black transition-all rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab === 'ALL' ? t('quotation.allQuotations') : 
                 tab === 'DRAFT' ? t('quotation.draft') :
                 tab === 'SENT' ? t('quotation.sent') :
                 tab === 'APPROVED' ? t('quotation.approved') :
                 t('quotation.converted')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('quotation.searchQuotations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredData}
          />
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('crm.delete')}
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
