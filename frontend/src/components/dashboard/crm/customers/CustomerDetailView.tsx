'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2, 
  FileText, IndianRupee, Loader2, MessageSquare, 
  TrendingUp, Calendar, ChevronRight, Clock, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, Customer, Lead, SiteVisit } from '@/lib/services/crm.services';

export function CustomerDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLeads, setCustomerLeads] = useState<Lead[]>([]);
  const [customerVisits, setCustomerVisits] = useState<SiteVisit[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('INQUIRIES & LEADS');

  useEffect(() => {
    if (customerId) {
      setLoading(true);
      crmService.getCustomerById(customerId)
        .then(async (custData) => {
          setCustomer(custData);
          if (custData) {
            // ponytail: server-side filtered fetches instead of full-collection downloads
            try {
              const matchedLeads = await crmService.getLeads({ phone: custData.phone });
              setCustomerLeads(matchedLeads);

              const matchedVisits = await crmService.getSiteVisits({ phone: custData.phone });
              setCustomerVisits(matchedVisits);
            } catch (err) {
              console.error('Error loading customer activity:', err);
            }
          }
        })
        .catch((err) => console.error('Error loading customer:', err))
        .finally(() => setLoading(false));
    }
  }, [customerId]);

  const handleDelete = async () => {
    if (customerId) {
      try {
        await crmService.deleteCustomer(customerId);
        router.push('/crm/customers');
      } catch (err) {
        console.error('Error deleting customer:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title={`${t('crm.customerDetails')} — ${customer.name}`} 
            description="View account profile, active inquiries, ground visits, and credit settings."
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/customers/${customer._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('crm.editProfile')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('crm.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile Card & Credit Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${customer.type === 'Corporate' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {customer.type === 'Corporate' ? t('crm.corporate') : t('crm.retail')}
                </span>
                <StatusBadge status={customer.isActive !== false ? 'Active' : 'Inactive'} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">{customer.name}</CardTitle>
                  {customer.contactPerson && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Contact Person: {customer.contactPerson}</p>
                  )}
                </div>
                <a href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full" title="WhatsApp Client">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{customer.phone}</p>
                  <p className="text-xs text-muted-foreground">{t('crm.primaryMobile')}</p>
                </div>
              </div>
              
              {customer.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{customer.email}</p>
                    <p className="text-xs text-muted-foreground">{t('crm.emailAddress')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{customer.address || '—'}</p>
                  <p className="text-xs text-muted-foreground">{t('crm.billingAddress')}</p>
                </div>
              </div>

              {customer.type === 'Corporate' && (
                <div className="flex items-start gap-3 pt-4 border-t border-border mt-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground uppercase tracking-wider">{customer.gstNumber || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{t('crm.gstinNumber')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {customer.type === 'Corporate' ? (
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  {t('crm.creditLimitStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-black text-foreground">₹ {(customer.creditLimit || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t('crm.approvedCreditLimit')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">{customer.paymentTerms || 0} {t('navbar.selectLanguage') !== 'Language' ? 'Days' : 'दिन'}</p>
                    <p className="text-xs text-muted-foreground">{t('crm.paymentTerms')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/30 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t('crm.engagementSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-foreground">{customerLeads.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('crm.totalInquiries')}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border">
                  <p className="text-xl font-bold text-foreground">{customerVisits.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">{t('crm.siteVisits')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Activity Tabs (Leads, Site Visits, Quotations) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <div className="border-b border-border flex items-center justify-between p-2 shrink-0 bg-muted/30">
              <div className="flex items-center gap-1">
                {[
                  { id: 'INQUIRIES & LEADS', label: `${t('crm.inquiriesAndLeads')} (${customerLeads.length})`, icon: TrendingUp },
                  { id: 'SITE VISITS', label: `${t('crm.siteVisitsLabel')} (${customerVisits.length})`, icon: MapPin },
                  { id: 'ACCOUNT STATEMENT', label: t('crm.accountSummary'), icon: FileText }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/crm/leads/new')}
                className="text-xs font-bold hidden sm:flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('crm.newInquiry')}
              </Button>
            </div>
            
            <CardContent className="pt-6 flex-1 overflow-auto">
              {activeTab === 'INQUIRIES & LEADS' && (
                <div>
                  {customerLeads.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <TrendingUp className="w-10 h-10 text-muted mx-auto mb-3" />
                      {t('crm.noInquiriesLinked')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerLeads.map((lead) => (
                        <div 
                          key={lead._id}
                          className="p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">{lead.leadId}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {lead.eventType}
                              </span>
                            </div>
                            <p className="font-bold text-foreground text-sm">{lead.customerName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {t('crm.eventDate')}: {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={lead.stage === 'Booked' ? 'Confirmed' : 'Pending'} customText={lead.stage} />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => router.push(`/crm/leads/${lead._id}`)}
                              className="text-xs font-bold text-primary hover:bg-primary/10"
                            >
                              {t('crm.viewLead')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'SITE VISITS' && (
                <div>
                  {customerVisits.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <MapPin className="w-10 h-10 text-muted mx-auto mb-3" />
                      {t('crm.noVisitsLinked')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerVisits.map((sv) => (
                        <div 
                          key={sv._id}
                          className="p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-primary" />
                              {sv.venueAddress}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              {sv.visitDate ? new Date(sv.visitDate).toLocaleString() : 'TBD'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={sv.status === 'Completed' ? 'Confirmed' : 'Pending'} customText={sv.status} />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => router.push(`/crm/site-visits/${sv._id}`)}
                              className="text-xs font-bold text-primary hover:bg-primary/10"
                            >
                              {t('crm.viewVisit')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ACCOUNT STATEMENT' && (
                <div className="p-4">
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border text-center">
                    <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h4 className="text-base font-bold text-foreground mb-1">{t('crm.accountLedgerTitle')}</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                      {t('crm.accountLedgerSub')}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/operations/quotations/new?customer=${encodeURIComponent(customer.name)}`)}
                      className="text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('crm.createQuotation')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('crm.deleteConfirmTitle')}
        message={t('crm.deleteConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
