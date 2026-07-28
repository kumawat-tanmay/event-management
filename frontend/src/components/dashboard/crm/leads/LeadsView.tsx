'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Eye, Edit, Trash2, Search, MessageSquare, PhoneCall, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, Lead } from '@/lib/services/crm.services';

export function LeadsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState('ALL LEADS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL LEADS', 'NEW', 'SITE VISIT', 'QUOTATION', 'BOOKED', 'LOST'];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const leadsData = await crmService.getLeads();
      setData(leadsData || []);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const confirmDelete = async () => {
    if (leadToDelete) {
      try {
        await crmService.deleteLead(leadToDelete);
        setData(data.filter(l => l._id !== leadToDelete));
      } catch (err) {
        console.error('Error deleting lead:', err);
      } finally {
        setDeleteModalOpen(false);
        setLeadToDelete(null);
      }
    }
  };

  const filteredData = data.filter(l => {
    const matchesSearch = (l.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.phone || '').includes(searchQuery) ||
                          (l.leadId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'ALL LEADS' ? true : (l.stage || '').toUpperCase() === activeTab;

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: t('crm.leadId'), 
      accessorKey: 'leadId', 
      cell: (row: Lead) => <span className="font-bold text-primary">{row.leadId || '—'}</span> 
    },
    { 
      header: t('crm.customerName'), 
      accessorKey: 'customerName', 
      cell: (row: Lead) => (
        <div>
          <p className="font-bold">{row.customerName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <PhoneCall className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      ) 
    },
    { 
      header: t('crm.eventCategory'), 
      accessorKey: 'eventType',
      cell: (row: Lead) => (
        <div>
          <p className="font-medium">{row.eventType}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.eventDate ? new Date(row.eventDate).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      )
    },
    { header: t('crm.source'), accessorKey: 'source', cell: (row: Lead) => <span className="text-muted-foreground">{row.source || 'Walk-in'}</span> },
    { 
      header: t('crm.stage'), 
      accessorKey: 'stage', 
      cell: (row: Lead) => {
        let statusText = row.stage || 'New';
        let mappedStatus = 'Pending';
        if (statusText === 'New') mappedStatus = 'Pending';
        if (statusText === 'Site Visit') mappedStatus = 'In Progress';
        if (statusText === 'Quotation') mappedStatus = 'Review';
        if (statusText === 'Booked') mappedStatus = 'Confirmed';
        if (statusText === 'Lost') mappedStatus = 'Cancelled';
        
        let displayStage: string = statusText;
        if (statusText === 'New') displayStage = t('crm.stageNew');
        if (statusText === 'Contacted') displayStage = t('crm.stageContacted');
        if (statusText === 'Site Visit') displayStage = t('crm.stageSiteVisit');
        if (statusText === 'Quotation') displayStage = t('crm.stageQuotation');
        if (statusText === 'Booked') displayStage = t('crm.stageBooked');
        if (statusText === 'Lost') displayStage = t('crm.stageLost');
        
        return <StatusBadge status={mappedStatus} customText={displayStage} />;
      }
    },
    {
      header: t('crm.actions'), accessorKey: 'actions', cell: (row: Lead) => (
        <div className="flex items-center justify-end gap-2">
          <a href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" title="WhatsApp">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </a>
          <Link href={`/crm/leads/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/leads/${row._id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setLeadToDelete(row._id);
              setDeleteModalOpen(true);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('sidebar.leads')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('crm.leadsSub')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchLeads} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('navbar.selectLanguage') !== 'Language' ? 'Refresh' : 'रिफ्रेश'}
          </Button>
          <Link href="/crm/leads/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('crm.newLead')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('crm.totalInquiries')}
          value={data.length}
          icon={Users}
          colorTheme="primary"
        />
        <StatsCard
          title={t('crm.newLead')}
          value={data.filter(l => l.stage === 'New').length}
          icon={Users}
          colorTheme="secondary"
        />
        <StatsCard
          title={t('crm.siteVisitsLabel')}
          value={data.filter(l => l.stage === 'Site Visit').length}
          icon={Users}
          colorTheme="warning"
        />
        <StatsCard
          title={t('sidebar.bookings')}
          value={data.filter(l => l.stage === 'Booked').length}
          icon={Users}
          colorTheme="success"
        />
      </div>

      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Users className="w-5 h-5 text-primary" />
            {t('crm.leadsTitle')}
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
                {tab === 'ALL LEADS' ? t('crm.allLeads') : 
                 tab === 'NEW' ? t('crm.stageNew') :
                 tab === 'SITE VISIT' ? t('crm.stageSiteVisit') :
                 tab === 'QUOTATION' ? t('crm.stageQuotation') :
                 tab === 'BOOKED' ? t('crm.stageBooked') :
                 tab === 'LOST' ? t('crm.stageLost') : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('crm.searchLeads')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
            />
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('crm.deleteLeadConfirmTitle')}
        message={t('crm.deleteLeadConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
