'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { settingsService, CompanySettings } from '@/lib/services/settings.services';
import toast from 'react-hot-toast';

export function CompanyProfileView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CompanySettings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    logo: '',
    isSetupComplete: false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    async function fetchCompany() {
      try {
        setLoading(true);
        const data = await settingsService.getCompany();
        if (data) {
          setFormData(data);
          if (data.logo) setLogoPreview(data.logo);
        }
      } catch (err: any) {
        console.error('Error fetching company settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Company Name is required');
      return;
    }

    try {
      setSaving(true);
      if (logoFile) {
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('email', formData.email || '');
        payload.append('phone', formData.phone || '');
        payload.append('address', formData.address || '');
        payload.append('gstin', formData.gstin || '');
        payload.append('logo', logoFile);
        
        const updated = await settingsService.updateCompany(payload);
        setFormData(updated);
        if (updated.logo) setLogoPreview(updated.logo);
      } else {
        const updated = await settingsService.updateCompany(formData);
        setFormData(updated);
      }
      toast.success('Company settings updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 w-full max-w-full">
        <div className="animate-pulse h-12 bg-muted rounded-xl w-64" />
        <div className="animate-pulse h-96 bg-muted rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full pb-16">
      {/* ─── SINGLE UNIFIED CONTAINER ───────────────────────────────────────── */}
      <form 
        onSubmit={handleSubmit} 
        className="w-full bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
      >
        {/* ─── Top Header Section ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 md:p-8 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8a5a32]/10 text-[#8a5a32] dark:text-[#c28854] flex items-center justify-center font-bold shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight">
                  Company Settings
                </h1>
                {formData.isSetupComplete && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Active ERP
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your event management business profile, branding logo, tax numbers, and contact details.
              </p>
            </div>
          </div>

          <ActionGuard permission="dashboard.view">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#8a5a32] hover:bg-[#6b4627] text-white font-semibold shadow-md gap-2 rounded-xl px-6 py-2.5 shrink-0"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </ActionGuard>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* ─── Section 1: Business Identity & Branding ──────────────────── */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
              <ImageIcon size={18} className="text-[#8a5a32]" />
              Business Identity & Branding
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group w-32 h-32 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shadow-inner">
                  {logoPreview ? (
                    /* eslint-disable-next-next/no-img-element */
                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-muted-foreground">
                      <Upload size={22} className="mx-auto mb-1 opacity-60" />
                      <span className="text-[11px] font-medium block">Upload Logo</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Upload size={18} className="mb-1" />
                    <span className="text-[11px] font-semibold">Change Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">PNG / JPG 512x512px</span>
              </div>

              {/* Company Form Inputs */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 block">
                    Company / Firm Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Krishna Tent & Events"
                    className="font-medium rounded-xl text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail size={14} className="text-muted-foreground" /> Email Address
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="admin@krishnatent.com"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Phone size={14} className="text-muted-foreground" /> Phone / Contact Number
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="+91 98290 12345"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section 2: Business Head Office Address ──────────────────── */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
              <MapPin size={18} className="text-[#8a5a32]" />
              Business Head Office Address
            </h2>
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 block">
                Full Business Address
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="Tonk Road, Near Sanganer Flyover, Jaipur, Rajasthan 302018"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              />
            </div>
          </div>

          {/* ─── Section 3: Taxation & Legal Information ─────────────────── */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
              <ShieldCheck size={18} className="text-[#8a5a32]" />
              Taxation & Legal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-muted-foreground" /> GSTIN Registration Number
                </label>
                <Input
                  name="gstin"
                  value={formData.gstin || ''}
                  onChange={handleChange}
                  placeholder="08AAAAA0000A1Z5"
                  className="rounded-xl uppercase font-mono tracking-wide"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
