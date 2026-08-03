'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Users, Eye, Edit, Building2, Briefcase, Trash2, Search, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, Customer } from '@/lib/services/crm.services';
import { ActionGuard } from '@/components/auth/ActionGuard';

export function CustomersView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState('ALL CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  
  const tabs = ['ALL CUSTOMERS', 'RETAIL', 'CORPORATE'];

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await crmService.getCustomers();
      setData(res.data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await crmService.deleteCustomer(customerToDelete);
        setData(data.filter(c => c._id !== customerToDelete));
      } catch (err) {
        console.error('Error deleting customer:', err);
      } finally {
        setDeleteModalOpen(false);
        setCustomerToDelete(null);
      }
    }
  };

  const filteredData = data.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.phone || '').includes(searchQuery);
    
    let matchesTab = true;
    if (activeTab === 'RETAIL') matchesTab = c.type === 'Retail';
    if (activeTab === 'CORPORATE') matchesTab = c.type === 'Corporate';

    return matchesSearch && matchesTab;
  });

  const columns = [
    { 
      header: t('crm.customerName'), 
      accessorKey: 'name', 
      cell: (row: Customer) => (
        <span className="font-bold text-foreground flex items-center gap-2">
          {row.type === 'Corporate' ? <Building2 className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
          {row.name}
        </span>
      ) 
    },
    { 
      header: t('crm.type'), 
      accessorKey: 'type', 
      cell: (row: Customer) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${row.type === 'Corporate' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {row.type === 'Corporate' ? t('crm.corporate') : t('crm.retail')}
        </span>
      ) 
    },
    { header: t('crm.phone'), accessorKey: 'phone' },
    { 
      header: t('crm.address'), 
      accessorKey: 'address',
      cell: (row: Customer) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.address || '—'}</span>
    },
    { 
      header: t('crm.creditLimit'), 
      accessorKey: 'creditLimit', 
      cell: (row: Customer) => (
        <span className="font-bold text-foreground">
          ₹ {(row.creditLimit || 0).toLocaleString()}
        </span>
      ) 
    },
    { 
      header: t('crm.status'), 
      accessorKey: 'isActive', 
      cell: (row: Customer) => <StatusBadge status={row.isActive !== false ? 'Active' : 'Inactive'} /> 
    },
    {
      header: t('crm.actions'), accessorKey: 'actions', cell: (row: Customer) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/crm/customers/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <ActionGuard permission="crm.update">
            <Link href={`/crm/customers/${row._id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>
          <ActionGuard permission="crm.delete">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setCustomerToDelete(row._id);
                setDeleteModalOpen(true);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('sidebar.customers')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('crm.customersSub')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchCustomers} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('navbar.selectLanguage') !== 'Language' ? 'Refresh' : 'रिफ्रेश'}
          </Button>
          <ActionGuard permission="crm.create">
            <Link href="/crm/customers/new" className="flex-1 sm:flex-none w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('crm.newCustomer')}</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatsCard
          title={t('crm.totalCustomers')}
          value={data.length}
          icon={Users}
          colorTheme="primary"
        />
        <StatsCard
          title={`${t('crm.retail')} ${t('sidebar.customers')}`}
          value={data.filter(c => c.type === 'Retail' || !c.type).length}
          icon={Users}
          colorTheme="secondary"
        />
        <StatsCard
          title={`${t('crm.corporate')} ${t('sidebar.customers')}`}
          value={data.filter(c => c.type === 'Corporate').length}
          icon={Building2}
          colorTheme="success"
        />
        <StatsCard
          title={t('crm.activeAccounts')}
          value={data.filter(c => c.isActive !== false).length}
          icon={Briefcase}
          colorTheme="primary"
        />
      </div>

      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Users className="w-5 h-5 text-primary" />
            {t('crm.customersTitle')}
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
                {tab === 'ALL CUSTOMERS' ? t('crm.allCustomers') : tab === 'RETAIL' ? t('crm.retail') : t('crm.corporate')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('crm.searchCustomers')}
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
        title={t('crm.deleteConfirmTitle')}
        message={t('crm.deleteConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
