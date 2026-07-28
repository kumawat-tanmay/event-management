'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { crmService, Lead, Customer } from '@/lib/services/crm.services';
import { userService, User } from '@/lib/services/user.services';

interface SiteVisitFormProps {
  isEdit?: boolean;
}

export function SiteVisitForm({ isEdit = false }: SiteVisitFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const visitId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);

  const [formData, setFormData] = useState<{
    lead: string;
    customerName: string;
    phone: string;
    visitDate: string;
    venueAddress: string;
    assignedStaff: string;
    notes: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
  }>({
    lead: '',
    customerName: '',
    phone: '',
    visitDate: '',
    venueAddress: '',
    assignedStaff: '',
    notes: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    // Fetch staff list for assignment
    userService.getUsers()
      .then((users) => setStaffUsers(users || []))
      .catch((err) => console.error('Error fetching staff list:', err));

    // Fetch leads list for linking
    crmService.getLeads()
      .then((leads) => setLeadsList(leads || []))
      .catch((err) => console.error('Error fetching leads list:', err));

    // Fetch customer list for optional auto-fill
    crmService.getCustomers()
      .then((res) => setCustomersList(res.data || []))
      .catch((err) => console.error('Error fetching customer list:', err));

    if (isEdit && visitId) {
      setLoading(true);
      crmService.getSiteVisits()
        .then((visits) => {
          const visit = visits.find(v => v._id === visitId);
          if (visit) {
            setFormData({
              lead: typeof visit.lead === 'object' ? visit.lead?._id || '' : visit.lead || '',
              customerName: visit.customerName || '',
              phone: visit.phone || '',
              visitDate: visit.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 16) : '',
              venueAddress: visit.venueAddress || '',
              assignedStaff: typeof visit.assignedStaff === 'object' ? visit.assignedStaff?._id || '' : visit.assignedStaff || '',
              notes: visit.notes || '',
              status: visit.status || 'Scheduled'
            });
          }
        })
        .catch((err) => console.error('Error fetching site visit:', err))
        .finally(() => setLoading(false));
    }
  }, [isEdit, visitId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-fill customer details if lead selected
    if (name === 'lead' && value) {
      const selectedLead = leadsList.find(l => l._id === value);
      if (selectedLead) {
        setFormData(prev => ({
          ...prev,
          lead: value,
          customerName: selectedLead.customerName || prev.customerName,
          phone: selectedLead.phone || prev.phone
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (custId) {
      const found = customersList.find(c => c._id === custId);
      if (found) {
        setFormData(prev => ({
          ...prev,
          customerName: found.name || '',
          phone: found.phone || ''
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customerName.trim()) {
      setErrorMsg('Customer name is required');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMsg('Valid phone number is required');
      return;
    }
    if (!formData.venueAddress.trim()) {
      setErrorMsg('Venue address is required');
      return;
    }
    if (!formData.visitDate) {
      setErrorMsg('Visit date and time are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        lead: formData.lead || undefined,
        assignedStaff: formData.assignedStaff || undefined
      };

      if (isEdit && visitId) {
        await crmService.updateSiteVisit(visitId, payload);
      } else {
        await crmService.createSiteVisit(payload);
      }
      router.push('/crm/site-visits');
    } catch (err: any) {
      console.error('Error saving site visit:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to schedule site visit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={isEdit ? t('crm.editVisit') : t('crm.newVisit')}
            description={isEdit ? "Update inspection details." : "Assign a supervisor to inspect a venue."}
          />
        </div>
      </div>
      
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>{t('crm.visitDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 text-error border border-error/20 text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.linkToSalesLead')}</label>
                <select 
                  name="lead"
                  value={formData.lead}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">{t('crm.directVisit')}</option>
                  {leadsList.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.leadId} - {lead.customerName} ({lead.eventType})
                    </option>
                  ))}
                </select>
              </div>

              {!formData.lead && !isEdit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5 text-primary">
                    <UserCheck className="w-4 h-4" />
                    {t('crm.selectExistingCustomer')}
                  </label>
                  <select 
                    onChange={handleSelectCustomer}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">-- Choose Saved Customer --</option>
                    {customersList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.customerName')} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Anjali Sharma"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.phone')} <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. 9829012345"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.venueAddress')} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="venueAddress"
                  value={formData.venueAddress}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Shiv Vilas Resort, MI Road, Jaipur"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.assignedStaff')} <span className="text-red-500">*</span></label>
                <select 
                  name="assignedStaff"
                  value={formData.assignedStaff}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.visitDate')} <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local" 
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.status')}</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crm.customerNotes')}</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter measurement notes, ground layout instructions..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                {t('roles.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('roles.saving')}
                  </span>
                ) : isEdit ? t('crm.saveVisit') : t('crm.newVisit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
