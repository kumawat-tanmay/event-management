'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { crmService, Customer } from '@/lib/services/crm.services';
import { userService, User } from '@/lib/services/user.services';

interface LeadFormProps {
  isEdit?: boolean;
}

export function LeadForm({ isEdit = false }: LeadFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [formData, setFormData] = useState<{
    customerName: string;
    phone: string;
    email: string;
    eventType: string;
    eventDate: string;
    source: string;
    stage: 'New' | 'Contacted' | 'Site Visit' | 'Quotation' | 'Booked' | 'Lost';
    assignedStaff: string;
    notes: string;
  }>({
    customerName: '',
    phone: '',
    email: '',
    eventType: 'Wedding',
    eventDate: '',
    source: 'Walk-in',
    stage: 'New',
    assignedStaff: '',
    notes: ''
  });

  useEffect(() => {
    // Fetch staff list for assignment dropdown
    userService.getUsers()
      .then((users) => setStaffUsers(users || []))
      .catch((err) => console.error('Error fetching staff list:', err));

    // Fetch existing customer directory
    crmService.getCustomers()
      .then((res) => setExistingCustomers(res.data || []))
      .catch((err) => console.error('Error fetching customers list:', err));

    if (isEdit && leadId) {
      setLoading(true);
      crmService.getLeadById(leadId)
        .then((lead) => {
          if (lead) {
            setFormData({
              customerName: lead.customerName || '',
              phone: lead.phone || '',
              email: lead.email || '',
              eventType: lead.eventType || 'Wedding',
              eventDate: lead.eventDate ? new Date(lead.eventDate).toISOString().split('T')[0] : '',
              source: lead.source || 'Walk-in',
              stage: lead.stage || 'New',
              assignedStaff: typeof lead.assignedStaff === 'object' ? lead.assignedStaff?._id || '' : lead.assignedStaff || '',
              notes: lead.notes || ''
            });
          }
        })
        .catch((err) => console.error('Error fetching lead:', err))
        .finally(() => setLoading(false));
    }
  }, [isEdit, leadId]);

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (custId) {
      const found = existingCustomers.find(c => c._id === custId);
      if (found) {
        setFormData(prev => ({
          ...prev,
          customerName: found.name || '',
          phone: found.phone || '',
          email: found.email || ''
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customerName.trim()) {
      setErrorMsg('Customer name is required');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMsg('Valid 10-digit phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        assignedStaff: formData.assignedStaff || undefined
      };

      if (isEdit && leadId) {
        await crmService.updateLead(leadId, payload);
      } else {
        await crmService.createLead(payload);
      }
      router.push('/crm/leads');
    } catch (err: any) {
      console.error('Error saving lead:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save lead');
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
            title={isEdit ? t('crm.editLead') : t('crm.newLead')}
            description={isEdit ? "Update lead inquiry details and sales stage." : "Capture new inquiry requirements and assign staff."}
          />
        </div>
      </div>
      
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>{t('crm.leadDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 text-error border border-error/20 text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {!isEdit && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <label className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4" />
                  Select Existing Customer (Optional Auto-Fill)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleSelectCustomer}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">-- New Customer (Type Details Below) --</option>
                  {existingCustomers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone}) - {c.type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Selecting an existing customer will automatically fill their name, phone, and email below.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.customerName')} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Rahul Verma"
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
                <label className="text-sm font-medium">{t('crm.emailAddress')}</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. rahul@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.eventType')} <span className="text-red-500">*</span></label>
                <select 
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Wedding">{t('navbar.selectLanguage') !== 'Language' ? 'Wedding' : 'शादी'}</option>
                  <option value="Sangeet">{t('navbar.selectLanguage') !== 'Language' ? 'Sangeet' : 'संगीत'}</option>
                  <option value="Corporate">{t('navbar.selectLanguage') !== 'Language' ? 'Corporate Gala' : 'कॉर्पोरेट'}</option>
                  <option value="Birthday">{t('navbar.selectLanguage') !== 'Language' ? 'Birthday Party' : 'जन्मदिन'}</option>
                  <option value="Festival">{t('navbar.selectLanguage') !== 'Language' ? 'Festival' : 'त्यौहार / उत्सव'}</option>
                  <option value="Exhibition">{t('navbar.selectLanguage') !== 'Language' ? 'Exhibition' : 'प्रदर्शनी'}</option>
                  <option value="Other">{t('navbar.selectLanguage') !== 'Language' ? 'Other' : 'अन्य'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.eventDate')}</label>
                <input 
                  type="date" 
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.source')}</label>
                <select 
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Call">Phone Call</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Reference">Reference</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.stage')}</label>
                <select 
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Booked">Booked</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.assignedRep')}</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crm.customerNotes')}</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter event details, venue ground requirements, tent or seating specs..."
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
                ) : isEdit ? t('crm.saveLead') : t('crm.newLead')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
