'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { hrService, Staff, StaffInput } from '@/lib/services/hr.services';
import { userService, User } from '@/lib/services/user.services';
import toast from 'react-hot-toast';

import { getStaffSchema } from '@/utils/validations';

interface StaffFormProps {
  isEdit?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  initialData?: Staff | null;
}

export function StaffForm({ isEdit = false, isOpen, onClose, onSuccess, initialData }: StaffFormProps) {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const staffId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [formData, setFormData] = useState<StaffInput>({
    name: '',
    phone: '',
    email: '',
    role: 'Labour',
    compensationType: 'daily',
    basePay: 500,
    status: 'Active',
    pendingDues: 0
  });

  useEffect(() => {
    // Fetch all invited/system users for auto-fill dropdown
    userService.getUsers()
      .then((users) => setSystemUsers(users || []))
      .catch((err) => console.error('Error loading system users:', err));

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        role: initialData.role || 'Labour',
        compensationType: initialData.compensationType || 'daily',
        basePay: initialData.basePay || 0,
        status: (initialData.status === 'On Leave' ? 'On Leave' : initialData.status === 'Inactive' ? 'Inactive' : 'Active'),
        pendingDues: initialData.pendingDues || 0
      });
    } else if (isEdit && staffId) {
      setLoading(true);
      hrService.getStaffById(staffId)
        .then((data) => {
          if (data) {
            setFormData({
              name: data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              role: data.role || 'Labour',
              compensationType: data.compensationType || 'daily',
              basePay: data.basePay || 0,
              status: (data.status === 'On Leave' ? 'On Leave' : data.status === 'Inactive' ? 'Inactive' : 'Active'),
              pendingDues: data.pendingDues || 0
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching staff member:', err);
          setErrorMsg('Failed to load staff details');
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, staffId, initialData, isOpen]);

  const handleSelectUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);

    if (!userId) return;

    const user = systemUsers.find(u => u._id === userId);
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: (user.role && ['Driver', 'Event Supervisor', 'Godown Manager', 'Labour', 'Accountant'].includes(user.role))
          ? user.role
          : (user.role === 'Admin' || user.role === 'Manager' ? 'Godown Manager' : prev.role)
      }));
      toast.success(`Auto-filled details for ${user.name}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePay' || name === 'pendingDues' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod validation check
    const validationResult = getStaffSchema(t).safeParse(formData);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'Invalid input';
      setErrorMsg(firstIssue);
      toast.error(firstIssue);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const targetId = initialData?._id || (isEdit ? staffId : null);
      if (targetId) {
        await hrService.updateStaff(targetId, validationResult.data as any);
        toast.success('Staff record updated successfully');
      } else {
        await hrService.createStaff(validationResult.data as any);
        toast.success('Staff record created successfully');
      }
      
      if (onSuccess) onSuccess();
      if (onClose) {
        onClose();
      } else {
        router.push('/hr/staff');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save staff record';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Form Fields Component
  const FormFields = (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      
      {/* Auto-Fill System Users Dropdown Banner */}
      {!initialData && !isEdit && systemUsers.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
          <label className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4" />
            {t('hr.autoFillSystemUser')}
          </label>
          <select
            value={selectedUserId}
            onChange={handleSelectUser}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">-- New Staff / Labour (Type Details Below) --</option>
            {systemUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email || 'No Email'}) - {u.role}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('hr.autoFillDesc')}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 text-error border border-error/20 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.fullName')} <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Ramesh Kumar"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.phoneMobile')} <span className="text-red-500">*</span></label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9829012345"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.designation')} <span className="text-red-500">*</span></label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="Driver">Driver</option>
            <option value="Event Supervisor">Event Supervisor</option>
            <option value="Godown Manager">Godown Manager</option>
            <option value="Labour">Labour</option>
            <option value="Accountant">Accountant</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.emailOptional')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. ramesh@example.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.compensationType')}</label>
          <select
            name="compensationType"
            value={formData.compensationType}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="daily">{t('hr.dailyWage')}</option>
            <option value="monthly">{t('hr.monthlySalary')}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">
            {formData.compensationType === 'daily' ? t('hr.dailyWageRate') : t('hr.monthlySalaryRate')}
          </label>
          <input
            type="number"
            name="basePay"
            value={formData.basePay}
            onChange={handleChange}
            placeholder="e.g. 500"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">{t('hr.pendingDues')} (₹)</label>
          <input
            type="number"
            name="pendingDues"
            value={formData.pendingDues}
            onChange={handleChange}
            placeholder="e.g. 1500"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <label className="text-sm font-bold text-foreground">{t('hr.status')}</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose ? onClose : () => router.back()} 
          disabled={submitting}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="gap-2 font-bold px-6">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{initialData || isEdit ? t('common.save', 'Save Changes') : t('hr.addStaff')}</span>
        </Button>
      </div>

    </form>
  );

  // Modal Mode (If isOpen prop is passed)
  if (isOpen !== undefined) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title={initialData ? t('hr.editStaff') : t('hr.addStaff')}
        size="lg"
      >
        {FormFields}
      </Modal>
    );
  }

  // Full-Page Mode
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader 
            title={isEdit ? t('hr.editStaff') : t('hr.addStaff')}
            description={isEdit ? 'Update employee designation, pay rates, and status.' : 'Register a new driver, supervisor, or worker into HR records.'}
          />
        </div>
      </div>

      {/* Main Card Form */}
      <Card className="w-full border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle>{isEdit ? 'Update Staff Member Information' : 'Staff Profile Information'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {FormFields}
        </CardContent>
      </Card>

    </div>
  );
}
