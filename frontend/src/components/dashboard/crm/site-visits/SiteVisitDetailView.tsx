'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Edit, Trash2, MapPin, Calendar, User, Ruler, 
  CheckSquare, Loader2, Phone, MessageSquare, Zap, Truck, 
  FileText, Link as LinkIcon, ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { crmService, SiteVisit } from '@/lib/services/crm.services';

export function SiteVisitDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const visitId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState<SiteVisit | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (visitId) {
      setLoading(true);
      crmService.getSiteVisitById(visitId)
        .then((data) => setVisit(data))
        .catch((err) => console.error('Error loading site visit:', err))
        .finally(() => setLoading(false));
    }
  }, [visitId]);

  const handleDelete = async () => {
    if (visitId) {
      try {
        await crmService.deleteSiteVisit(visitId);
      } catch (err) {
        console.error('Error deleting site visit:', err);
      }
      setDeleteModalOpen(false);
      router.push('/crm/site-visits');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Site Visit record not found.
      </div>
    );
  }

  let mappedStatus = 'Pending';
  if (visit.status === 'Scheduled') mappedStatus = 'Pending';
  if (visit.status === 'Completed') mappedStatus = 'Confirmed';
  if (visit.status === 'Cancelled') mappedStatus = 'Cancelled';

  const linkedLeadId = typeof visit.lead === 'object' ? visit.lead?._id : visit.lead;
  const linkedLeadRef = typeof visit.lead === 'object' ? visit.lead?.leadId : null;

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title={t('crm.siteVisitDetails')} 
            description={`Ground inspection report & venue overview for ${visit.venueAddress}.`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/crm/site-visits/${visit._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('crm.editVisit')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('crm.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Venue Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  SITE VISIT
                </span>
                <StatusBadge status={mappedStatus} customText={visit.status} />
              </div>
              <CardTitle className="text-lg font-bold flex items-start gap-2 text-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>{visit.venueAddress}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('crm.customerName')}</p>
                  <p className="font-bold text-lg text-foreground mt-0.5">{visit.customerName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5 text-primary" /> {visit.phone}
                  </p>
                </div>
                <a href={`https://wa.me/${visit.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full" title="WhatsApp Client">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </a>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> {t('crm.visitDate')}
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {visit.visitDate ? new Date(visit.visitDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'TBD'}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-primary" /> {t('crm.assignedRep')}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(typeof visit.assignedStaff === 'object' ? visit.assignedStaff?.name?.charAt(0) : visit.assignedStaff?.charAt(0)) || 'U'}
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">
                      {typeof visit.assignedStaff === 'object' ? visit.assignedStaff?.name || 'Unassigned' : visit.assignedStaff || 'Unassigned'}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Ground Supervisor</span>
                  </div>
                </div>
              </div>

              {linkedLeadId && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Linked Sales Lead
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/crm/leads/${linkedLeadId}`)}
                    className="w-full mt-2 flex items-center justify-between text-xs font-bold"
                  >
                    <span>Ref: {linkedLeadRef || 'View Lead Profile'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                {t('crm.pipelineActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button 
                variant="primary" 
                className="w-full justify-start text-xs font-bold"
                onClick={() => router.push(`/operations/quotations/new?customer=${encodeURIComponent(visit.customerName)}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('crm.createQuotationClient')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                onClick={() => router.push('/crm/site-visits')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('crm.backToSiteVisits')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ground Inspection Report */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                {t('crm.inspectionReport')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-sm">
                    <Ruler className="w-4 h-4" /> Ground Layout & Dimensions
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Inspection notes specify venue dimensions, tent layout boundaries, and stage dimensions.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-sm">
                    <Zap className="w-4 h-4" /> Power & Electricity Supply
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    3-Phase electricity connection points & generator backup access.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-sm">
                    <Truck className="w-4 h-4" /> Logistics & Vehicle Access
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Truck loading entry gate & unloading access for tent materials.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-sm">
                    <CheckSquare className="w-4 h-4" /> Inspection Status
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 inline-block mt-1">
                    {visit.status}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-background shadow-xs">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Supervisor Ground Notes & Observations
                </h4>
                <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                  {visit.notes || t('crm.noNotes')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('crm.deleteVisitConfirmTitle')}
        message={t('crm.deleteVisitConfirmMsg')}
        confirmText={t('crm.delete')}
      />
    </div>
  );
}
