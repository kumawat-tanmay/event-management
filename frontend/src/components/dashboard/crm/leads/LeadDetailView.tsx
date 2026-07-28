'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Edit, Trash2, Phone, Calendar, MapPin, 
  MessageSquare, FileText, Loader2, User, Mail, 
  CheckCircle2, AlertCircle, Clock, ChevronRight, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, Lead, SiteVisit } from '@/lib/services/crm.services';

const PIPELINE_STAGES: ('New' | 'Contacted' | 'Site Visit' | 'Quotation' | 'Booked' | 'Lost')[] = [
  'New', 'Contacted', 'Site Visit', 'Quotation', 'Booked'
];

export function LeadDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchLeadData = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const data = await crmService.getLeadById(leadId);
      setLead(data);

      // ponytail: server-side filtered fetch instead of full-collection download
      const linked = await crmService.getSiteVisits({ leadId });
      setSiteVisits(linked);
    } catch (err) {
      console.error('Error loading lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleStageChange = async (newStage: 'New' | 'Contacted' | 'Site Visit' | 'Quotation' | 'Booked' | 'Lost') => {
    if (!lead || lead.stage === newStage) return;
    setUpdatingStage(true);
    try {
      const updated = await crmService.updateLead(lead._id, { stage: newStage });
      setLead(updated);
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleDelete = async () => {
    if (leadId) {
      try {
        await crmService.deleteLead(leadId);
        router.push('/crm/leads');
      } catch (err) {
        console.error('Error deleting lead:', err);
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

  if (!lead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Sales Lead not found.
      </div>
    );
  }

  let mappedStatus = 'Pending';
  if (lead.stage === 'New') mappedStatus = 'Pending';
  if (lead.stage === 'Contacted') mappedStatus = 'Pending';
  if (lead.stage === 'Site Visit') mappedStatus = 'In Progress';
  if (lead.stage === 'Quotation') mappedStatus = 'Review';
  if (lead.stage === 'Booked') mappedStatus = 'Confirmed';
  if (lead.stage === 'Lost') mappedStatus = 'Cancelled';

  const currentStageIndex = PIPELINE_STAGES.indexOf(lead.stage as any);

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title={`${t('crm.leadDetails')} ${lead.leadId} — ${lead.customerName}`}
            description="Track sales pipeline stage, ground visits, and quick actions."
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/leads/${lead._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('crm.editLead')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('crm.delete')}
          </Button>
        </div>
      </div>

      {/* Interactive Sales Pipeline Progress Bar */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-4 md:p-6 bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('crm.pipelineProgression')}
            </span>
            {updatingStage && (
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('crm.updatingStage')}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PIPELINE_STAGES.map((stageName, index) => {
              const isCurrent = lead.stage === stageName;
              const isPassed = currentStageIndex >= 0 && index < currentStageIndex;

              return (
                <button
                  key={stageName}
                  onClick={() => handleStageChange(stageName)}
                  disabled={updatingStage}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center ${
                    isCurrent
                      ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/30'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{t('crm.step')} {index + 1}</span>
                  </div>
                  <span className="text-sm font-black truncate max-w-full">
                    {stageName === 'New' ? t('crm.stageNew') :
                     stageName === 'Contacted' ? t('crm.stageContacted') :
                     stageName === 'Site Visit' ? t('crm.stageSiteVisit') :
                     stageName === 'Quotation' ? t('crm.stageQuotation') :
                     stageName === 'Booked' ? t('crm.stageBooked') : stageName}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Profile & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                      {lead.leadId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Source: {lead.source || 'Walk-in'}
                    </span>
                    <StatusBadge status={mappedStatus} customText={lead.stage} />
                  </div>
                  <CardTitle className="text-2xl font-black text-foreground mt-1">{lead.customerName}</CardTitle>
                </div>
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-10 w-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full" title="Chat on WhatsApp">
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </a>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('crm.contactMobile')}</p>
                    <p className="font-bold text-foreground text-base mt-0.5">{lead.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('crm.eventDate')}</p>
                    <p className="font-bold text-foreground text-base mt-0.5">
                      {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('crm.eventCategory')}</p>
                    <p className="font-bold text-foreground text-base mt-0.5">{lead.eventType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('crm.assignedRep')}</p>
                    <p className="font-bold text-foreground text-base mt-0.5">
                      {typeof lead.assignedStaff === 'object' ? lead.assignedStaff?.name || 'Unassigned' : lead.assignedStaff || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{lead.email}</span>
                </div>
              )}

              <div className="mt-6 border-t border-border pt-6">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('crm.customerNotes')}
                </h4>
                <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                  {lead.notes || t('crm.noNotes')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Site Visits Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {t('crm.linkedSiteVisits')} ({siteVisits.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/crm/site-visits/new')}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('crm.newVisit')}
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {siteVisits.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {t('crm.noVisitsScheduled')}
                </div>
              ) : (
                <div className="space-y-3">
                  {siteVisits.map((sv) => (
                    <div 
                      key={sv._id}
                      className="p-4 rounded-xl border border-border bg-muted/10 flex items-center justify-between gap-4"
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
                          {t('crm.viewReport')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Quick Status Change */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-base font-bold">{t('crm.pipelineActions')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-3">
              <Button 
                variant="primary" 
                className="w-full justify-start text-xs font-bold"
                onClick={() => router.push('/crm/site-visits/new')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {t('crm.scheduleSiteVisit')}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-xs font-bold"
                onClick={() => router.push(`/operations/quotations/new?customer=${encodeURIComponent(lead.customerName)}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('crm.createQuotationClient')}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                onClick={() => handleStageChange('Booked')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                {t('crm.markBooked')}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-xs font-bold text-error bg-error/5 hover:bg-error/10 border-error/20"
                onClick={() => handleStageChange('Lost')}
              >
                <AlertCircle className="w-4 h-4 mr-2 text-error" />
                {t('crm.markLost')}
              </Button>

              <div className="pt-3 border-t border-border mt-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-xs text-muted-foreground"
                  onClick={() => router.push('/crm/leads')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('crm.backToLeads')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('crm.deleteLeadConfirmTitle')}
        message={t('crm.deleteLeadConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
