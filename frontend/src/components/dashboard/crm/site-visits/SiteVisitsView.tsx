'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, MapPin, Eye, Edit, Trash2, Search, Calendar, Users, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, SiteVisit } from '@/lib/services/crm.services';

export function SiteVisitsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SiteVisit[]>([]);
  const [activeTab, setActiveTab] = useState('ALL VISITS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL VISITS', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

  const fetchSiteVisits = async () => {
    setLoading(true);
    try {
      const visits = await crmService.getSiteVisits();
      setData(visits || []);
    } catch (err) {
      console.error('Error loading site visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteVisits();
  }, []);

  const confirmDelete = () => {
    if (visitToDelete) {
      setData(data.filter(v => v._id !== visitToDelete));
      setDeleteModalOpen(false);
      setVisitToDelete(null);
    }
  };

  const filteredData = data.filter(v => {
    const matchesSearch = (v.venueAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.phone || '').includes(searchQuery);
    
    const matchesTab = activeTab === 'ALL VISITS' ? true : (v.status || '').toUpperCase() === activeTab;

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: t('crm.customerName'), 
      accessorKey: 'customerName', 
      cell: (row: SiteVisit) => (
        <div>
          <span className="font-bold text-foreground">{row.customerName}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{row.phone}</p>
        </div>
      ) 
    },
    { 
      header: t('crm.venueAddress'), 
      accessorKey: 'venueAddress', 
      cell: (row: SiteVisit) => (
        <div>
          <p className="font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {row.venueAddress}
          </p>
        </div>
      ) 
    },
    { 
      header: t('crm.visitDate'), 
      accessorKey: 'visitDate',
      cell: (row: SiteVisit) => (
        <div>
          <p className="font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {row.visitDate ? new Date(row.visitDate).toLocaleString() : 'TBD'}
          </p>
        </div>
      )
    },
    { 
      header: t('crm.assignedStaff'), 
      accessorKey: 'assignedStaff',
      cell: (row: SiteVisit) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
          <Users className="w-3 h-3" />
          {row.assignedStaff?.name || 'Unassigned'}
        </span>
      )
    },
    { 
      header: t('crm.status'), 
      accessorKey: 'status', 
      cell: (row: SiteVisit) => {
        let statusText = row.status || 'Scheduled';
        let mappedStatus = 'Pending';
        if (statusText === 'Scheduled') mappedStatus = 'Pending';
        if (statusText === 'Completed') mappedStatus = 'Confirmed';
        if (statusText === 'Cancelled') mappedStatus = 'Cancelled';
        return <StatusBadge status={mappedStatus} customText={statusText} />;
      }
    },
    {
      header: t('crm.actions'), accessorKey: 'actions', cell: (row: SiteVisit) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/crm/site-visits/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/site-visits/${row._id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setVisitToDelete(row._id);
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
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('sidebar.siteVisits')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('crm.siteVisitsSub')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchSiteVisits} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('navbar.selectLanguage') !== 'Language' ? 'Refresh' : 'रिफ्रेश'}
          </Button>
          <Link href="/crm/site-visits/new" className="flex-1 sm:flex-none w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('crm.newSiteVisit')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('crm.siteVisits')}
          value={data.length}
          icon={MapPin}
          colorTheme="primary"
        />
        <StatsCard
          title={t('crm.scheduled')}
          value={data.filter(v => v.status === 'Scheduled' || !v.status).length}
          icon={Calendar}
          colorTheme="warning"
        />
        <StatsCard
          title={t('crm.completed')}
          value={data.filter(v => v.status === 'Completed').length}
          icon={Users}
          colorTheme="success"
        />
        <StatsCard
          title={t('crm.cancelled')}
          value={data.filter(v => v.status === 'Cancelled').length}
          icon={Users}
          colorTheme="error"
        />
      </div>

      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <MapPin className="w-5 h-5 text-primary" />
            {t('crm.inspectionSchedule')}
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
                {tab === 'ALL VISITS' ? t('crm.allSiteVisits') : tab === 'SCHEDULED' ? t('crm.scheduled') : tab === 'COMPLETED' ? t('crm.completed') : t('crm.cancelled')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('crm.searchSiteVisits')}
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
        title={t('crm.deleteVisitConfirmTitle')}
        message={t('crm.deleteVisitConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
