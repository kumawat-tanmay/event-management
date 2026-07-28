'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Download, FileText, Eye, Edit, Trash2, Search, CheckCircle, Clock, CalendarDays, FileCheck, IndianRupee } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { quotationService, Quotation, QuotationStats } from '@/lib/services/quotation.services';

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

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab !== 'ALL' ? activeTab.charAt(0) + activeTab.slice(1).toLowerCase() : undefined;
      const response = await quotationService.getQuotations({
        search: searchQuery || undefined,
        status: statusFilter,
      });
      setData(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

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

  const columns = [
    { 
      header: t('quotation.quotationId'), 
      accessorKey: 'quotationId', 
      cell: (row: any) => (
        <span className="font-mono text-sm font-bold text-foreground">
          {row.quotationId}
        </span>
      ) 
    },
    { 
      header: t('quotation.customer'), 
      accessorKey: 'customer', 
      cell: (row: any) => (
        <div>
          <p className="font-bold text-foreground">{row.customer?.name || '—'}</p>
          <span className="text-xs text-muted-foreground">{row.customer?.type === 'Retail' ? t('crm.retail') : t('crm.corporate')}</span>
        </div>
      ) 
    },
    { 
      header: t('quotation.dates'), 
      accessorKey: 'dates', 
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(row.eventStartDate).toLocaleDateString()} to {new Date(row.eventEndDate).toLocaleDateString()}</span>
        </div>
      ) 
    },
    { 
      header: t('quotation.amount'), 
      accessorKey: 'grandTotal', 
      cell: (row: any) => (
        <span className="font-bold text-foreground">
          ₹ {(row.grandTotal || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('quotation.status'), 
      accessorKey: 'status', 
      cell: (row: any) => {
        let statusKey = 'draft';
        if (row.status === 'Sent') statusKey = 'sent';
        if (row.status === 'Approved') statusKey = 'approved';
        if (row.status === 'Converted') statusKey = 'converted';
        if (row.status === 'Rejected') statusKey = 'rejected';
        return <StatusBadge status={row.status} customText={t(`quotation.${statusKey}`)} />;
      }
    },
    {
      header: t('quotation.actions'), 
      accessorKey: 'actions', 
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/operations/quotations/${row._id}`} title={t('quotation.viewQuotation')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/operations/quotations/${row._id}/edit`} title={t('quotation.editQuotation')}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" disabled={row.status === 'Converted'}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
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
          <Link href="/operations/quotations/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('quotation.newQuotation')}</span>
            </Button>
          </Link>
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
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
            data={data}
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
