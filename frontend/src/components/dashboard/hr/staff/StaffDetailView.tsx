'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Edit, Trash2, Phone, Calendar, 
  MessageSquare, Loader2, IndianRupee, CreditCard, User, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { hrService, Staff } from '@/lib/services/hr.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import toast from 'react-hot-toast';

export function StaffDetailView() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const staffId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Log Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payType, setPayType] = useState<'Salary' | 'Advance' | 'Allowance' | 'Bonus'>('Salary');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  const fetchStaffData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const data = await hrService.getStaffById(staffId);
      setStaff(data);
    } catch (err) {
      console.error('Error loading staff details:', err);
      toast.error('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [staffId]);

  const handleDelete = async () => {
    if (staffId) {
      try {
        await hrService.deleteStaff(staffId);
        toast.success('Staff record deleted');
        router.push('/hr/staff');
      } catch (err) {
        console.error('Error deleting staff record:', err);
        toast.error('Failed to delete staff record');
      }
    }
  };

  const [customPendingDues, setCustomPendingDues] = useState<string>('');

  const handleOpenPayModal = () => {
    if (!staff) return;
    setPayAmount(staff.pendingDues > 0 ? String(staff.pendingDues) : '');
    setCustomPendingDues(String(staff.pendingDues || 0));
    setPayType('Salary');
    setPayMode('Cash');
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount || 0);
    const dues = customPendingDues !== '' ? Number(customPendingDues) : undefined;

    if (!staff || (amt <= 0 && dues === undefined)) {
      toast.error('Please enter a valid payment amount or pending dues');
      return;
    }

    setIsPaying(true);
    try {
      const updated = await hrService.logPayment(staff._id, {
        amount: amt,
        type: payType,
        mode: payMode,
        notes: payNotes,
        newPendingDues: dues
      });
      toast.success(`Payment & dues updated for ${staff.name}`);
      setStaff(updated);
      setIsPayModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to log payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-foreground">{t('hr.staffNotFound')}</h3>
        <Button variant="outline" onClick={() => router.push('/hr/staff')}>
          {t('hr.backToStaff')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                {staff.staffId}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                staff.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-400/10 text-zinc-500'
              }`}>
                {staff.status}
              </span>
            </div>
            <PageHeader 
              title={staff.name}
              description={`${staff.role} • Joined ${new Date(staff.joinedDate || Date.now()).toLocaleDateString()}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Green WhatsApp Action Button */}
          <a href={`https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 font-bold">
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>
          </a>

          {/* Pay Salary / Advance Button */}
          <ActionGuard permission="hr.update">
            <Button variant="primary" onClick={handleOpenPayModal} className="gap-2 font-bold">
              <IndianRupee className="w-4 h-4" />
              <span>{t('hr.logPayment')}</span>
            </Button>
          </ActionGuard>

          {/* Edit */}
          <ActionGuard permission="hr.update">
            <Button variant="outline" onClick={() => router.push(`/hr/staff/${staff._id}/edit`)} className="gap-2">
              <Edit className="w-4 h-4" />
              <span>{t('common.edit', 'Edit')}</span>
            </Button>
          </ActionGuard>

          {/* Delete */}
          <ActionGuard permission="hr.delete">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(true)} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Top Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title={t('hr.payRate')}
          value={`₹${staff.basePay.toLocaleString()}`}
          icon={CreditCard}
          colorTheme="primary"
        />
        <StatsCard
          title={t('hr.totalPaid')}
          value={`₹${(staff.totalPaid || 0).toLocaleString()}`}
          icon={IndianRupee}
          colorTheme="success"
        />
        <StatsCard
          title={t('hr.pendingDues')}
          value={`₹${(staff.pendingDues || 0).toLocaleString()}`}
          icon={IndianRupee}
          colorTheme="warning"
        />
      </div>

      {/* Staff Profile & Payment History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Staff Info Card */}
        <Card className="w-full border-border shadow-sm h-fit">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle>{t('hr.staffProfileInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.designationRole')}</p>
                <p className="font-bold text-foreground">{staff.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.phoneNumber')}</p>
                <p className="font-bold text-foreground">{staff.phone}</p>
              </div>
            </div>

            {staff.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.emailAddress')}</p>
                  <p className="font-semibold text-foreground">{staff.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{t('hr.paySchedule')}</p>
                <p className="font-bold text-foreground capitalize">{t('hr.wageRate', { type: staff.compensationType })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Payment Ledger Table */}
        <Card className="w-full lg:col-span-2 border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 pb-4 flex flex-row items-center justify-between">
            <CardTitle>{t('hr.paymentHistoryLedger')}</CardTitle>
            <span className="text-xs font-bold text-muted-foreground">
              {t('hr.totalLogs', { count: staff.paymentHistory?.length || 0 })}
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            {!staff.paymentHistory || staff.paymentHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                {t('hr.noPaymentsYet')}
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-muted-foreground uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">{t('hr.date')}</th>
                      <th className="p-3">{t('hr.paymentType')}</th>
                      <th className="p-3">{t('hr.paymentMode')}</th>
                      <th className="p-3">{t('hr.amount')}</th>
                      <th className="p-3">{t('hr.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {staff.paymentHistory.map((log, index) => (
                      <tr key={log._id || index} className="hover:bg-muted/50">
                        <td className="p-3 text-muted-foreground font-medium">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">
                            {log.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-muted-foreground">{log.mode}</td>
                        <td className="p-3 font-extrabold text-emerald-600">₹{log.amount.toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground italic truncate max-w-[200px]">{log.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Log Payment Modal */}
      {isPayModalOpen && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={t('hr.logPaymentTitle', { name: staff.name })}
          size="md"
        >
          <form onSubmit={handleSubmitPayment} className="space-y-5 font-sans">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>{t('hr.currentPendingDues')}</span>
                <span className="text-[11px] font-normal text-muted-foreground font-sans">(Editable if adjusting balance)</span>
              </label>
              <Input
                type="number"
                value={customPendingDues}
                onChange={(e) => setCustomPendingDues(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('hr.paymentAmount')} *</label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 2000"
                required
                autoFocus
              />
            </div>

            {/* Live Preview Box */}
            <div className="p-3.5 bg-muted/40 border border-border rounded-xl flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground">{t('hr.estRemainingDues')}</span>
              <span className={`font-black text-sm ${Math.max(0, Number(customPendingDues || 0) - Number(payAmount || 0)) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ₹{Math.max(0, Number(customPendingDues || 0) - Number(payAmount || 0)).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('hr.paymentType')}</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Salary">Salary</option>
                  <option value="Advance">Advance</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Bonus">Bonus</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('hr.paymentMode')}</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('hr.notesRemarks')}</label>
              <Input
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. Weekly advance payment"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPaying} className="font-bold">
                {t('hr.confirmLogPayment')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('hr.deleteStaffTitle')}
        message={t('hr.deleteStaffMsg')}
      />

    </div>
  );
}
