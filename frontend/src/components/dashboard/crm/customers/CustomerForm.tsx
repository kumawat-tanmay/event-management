'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { crmService } from '@/lib/services/crm.services';

interface CustomerFormProps {
  isEdit?: boolean;
}

export function CustomerForm({ isEdit = false }: CustomerFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerType, setCustomerType] = useState<'Retail' | 'Corporate'>('Retail');
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    creditLimit: '0',
    paymentTerms: '0'
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isEdit && customerId) {
      setLoading(true);
      crmService.getCustomerById(customerId)
        .then((customer) => {
          if (customer) {
            setCustomerType(customer.type || 'Retail');
            setFormData({
              name: customer.name || '',
              contactPerson: customer.contactPerson || '',
              phone: customer.phone || '',
              email: customer.email || '',
              address: customer.address || '',
              gstNumber: customer.gstNumber || '',
              creditLimit: String(customer.creditLimit || 0),
              paymentTerms: String(customer.paymentTerms || 0)
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching customer:', err);
          setErrorMsg('Failed to load customer details');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Customer name is required');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMsg('Valid 10-digit phone number is required');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Billing address is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: customerType,
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase(),
        creditLimit: Number(formData.creditLimit) || 0,
        paymentTerms: Number(formData.paymentTerms) || 0
      };

      if (isEdit && customerId) {
        await crmService.updateCustomer(customerId, payload);
      } else {
        await crmService.createCustomer(payload);
      }

      router.push('/crm/customers');
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
            title={isEdit ? t('crm.editProfile') : t('crm.newCustomer')}
            description={isEdit ? "Update client details and credit limits." : "Create a new retail or corporate customer profile."}
          />
        </div>
      </div>
      
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>{t('crm.customerDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 text-error border border-error/20 text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-2 max-w-sm mb-6">
              <label className="text-sm font-medium">{t('crm.type')} <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="Retail" 
                    checked={customerType === 'Retail'} 
                    onChange={() => setCustomerType('Retail')} 
                    className="accent-primary"
                  />
                  <span>{t('crm.retail')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value="Corporate" 
                    checked={customerType === 'Corporate'} 
                    onChange={() => setCustomerType('Corporate')}
                    className="accent-primary"
                  />
                  <span>{t('crm.corporate')}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.customerName')} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Royal Weddings or Ramesh Sharma"
                  required
                />
              </div>
              
              {customerType === 'Corporate' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Person Name</label>
                  <input 
                    type="text" 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Vikram Singh"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('crm.emailAddress')}</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. contact@royalweddings.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crm.billingAddress')} <span className="text-red-500">*</span></label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter complete billing address"
                required
              ></textarea>
            </div>

            {customerType === 'Corporate' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('crm.gstinNumber')}</label>
                  <input 
                    type="text" 
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary uppercase outline-none"
                    placeholder="e.g. 08AAAAA0000A1Z5"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('crm.creditLimit')}</label>
                  <input 
                    type="number" 
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. 100000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('crm.paymentTerms')}</label>
                  <input 
                    type="number" 
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                {t('roles.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('roles.saving')}
                  </span>
                ) : isEdit ? t('crm.saveCustomer') : t('crm.newCustomer')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
