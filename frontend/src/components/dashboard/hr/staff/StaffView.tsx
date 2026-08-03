'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Eye, Edit, Trash2, Search, MessageSquare, RefreshCw, IndianRupee, CreditCard } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatsCard } from '@/components/common/StatsCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Modal } from '@/components/common/Modal';
import { hrService, Staff } from '@/lib/services/hr.services';
import { userService } from '@/lib/services/user.services';
import { ActionGuard } from '@/components/auth/ActionGuard';
import toast from 'react-hot-toast';

export function StaffView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState('ALL STAFF');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  // Log Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingStaff, setPayingStaff] = useState<Staff | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payType, setPayType] = useState<'Salary' | 'Advance' | 'Allowance' | 'Bonus'>('Salary');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  const roleTabs = ['ALL STAFF', 'ADMIN', 'DRIVER', 'SUPERVISOR', 'MANAGER', 'LABOUR', 'ACCOUNTANT'];

  // Fetch Staff List
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const currentStaff = await hrService.getStaff();
      setData(currentStaff || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const confirmDelete = async () => {
    if (staffToDelete) {
      try {
        await hrService.deleteStaff(staffToDelete);
        toast.success('Staff record deleted');
        setData(data.filter(s => s._id !== staffToDelete));
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete staff member');
      } finally {
        setDeleteModalOpen(false);
        setStaffToDelete(null);
      }
    }
  };

  const [customPendingDues, setCustomPendingDues] = useState<string>('');

  const handleOpenPayModal = (staff: Staff) => {
    setPayingStaff(staff);
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

    if (!payingStaff || (amt <= 0 && dues === undefined)) {
      toast.error('Please enter a valid payment amount or pending dues');
      return;
    }

    setIsPaying(true);
    try {
      const updated = await hrService.logPayment(payingStaff._id, {
        amount: amt,
        type: payType,
        mode: payMode,
        notes: payNotes,
        newPendingDues: dues
      });
      toast.success(`Payment & dues updated for ${payingStaff.name}`);
      setData(data.map(s => s._id === updated._id ? updated : s));
      setIsPayModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to log payment');
    } finally {
      setIsPaying(false);
    }
  };

  const filteredData = data.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.phone || '').includes(searchQuery) ||
                          (s.staffId || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab !== 'ALL STAFF') {
      matchesTab = (s.role || '').toUpperCase().includes(activeTab);
    }
    return matchesSearch && matchesTab;
  });

  const totalMonthlyPayroll = data.reduce((sum, s) => sum + (s.compensationType === 'monthly' ? s.basePay : s.basePay * 26), 0);
  const totalPendingDues = data.reduce((sum, s) => sum + (s.pendingDues || 0), 0);

  const columns = [
    {
      header: t('hr.staffIdName'), accessorKey: 'name', cell: (row: Staff) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <Link href={`/hr/staff/${row._id}`} className="font-bold text-foreground text-sm hover:text-primary transition-colors flex items-center gap-1.5">
              {row.name}
              <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-1.5 py-0.2 rounded">
                {row.staffId}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">{row.phone}</span>
          </div>
        </div>
      )
    },
    {
      header: t('hr.designation'), accessorKey: 'role', cell: (row: Staff) => (
        <span className="font-semibold text-xs text-foreground bg-zinc-100 dark:bg-zinc-800 border border-border/50 px-2.5 py-1 rounded-lg">
          {row.role}
        </span>
      )
    },
    {
      header: t('hr.payRate'), accessorKey: 'basePay', cell: (row: Staff) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-foreground">
            ₹{row.basePay.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">{row.compensationType}</span>
        </div>
      )
    },
    {
      header: t('hr.totalPaid'), accessorKey: 'totalPaid', cell: (row: Staff) => (
        <span className="font-extrabold text-xs text-emerald-600">
          ₹{(row.totalPaid || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: t('hr.pendingDuesCol'), accessorKey: 'pendingDues', cell: (row: Staff) => (
        <span className={`font-extrabold text-xs ${row.pendingDues > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
          ₹{(row.pendingDues || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions', accessorKey: 'actions', cell: (row: Staff) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Green WhatsApp Action Button */}
          <a href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" title="WhatsApp Chat">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </a>

          {/* Log Payment Button */}
          <ActionGuard permission="hr.update">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleOpenPayModal(row)}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Log Salary / Advance Payment"
            >
              <IndianRupee className="w-4 h-4" />
            </Button>
          </ActionGuard>

          {/* View Details Link */}
          <Link href={`/hr/staff/${row._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="View Profile">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          {/* Edit Link */}
          <ActionGuard permission="hr.update">
            <Link href={`/hr/staff/${row._id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit Staff Record">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          </ActionGuard>

          {/* Delete */}
          <ActionGuard permission="hr.delete">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setStaffToDelete(row._id);
                setDeleteModalOpen(true);
              }}
              className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
              title="Delete Staff Record"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ActionGuard>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">{t('hr.staffTitle')}</h2>
          <p className="text-sm font-medium text-muted-foreground">{t('hr.staffSub')}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Refresh')}</span>
          </Button>
          <ActionGuard permission="hr.create">
            <Link href="/hr/staff/new" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2 font-bold">
                <Plus className="w-4 h-4 shrink-0" />
                <span>{t('hr.addStaff')}</span>
              </Button>
            </Link>
          </ActionGuard>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title={t('hr.totalStaff')}
          value={data.length}
          icon={Users}
          colorTheme="primary"
        />
        <StatsCard
          title={t('hr.activeOnDuty')}
          value={data.filter(s => s.status === 'Active').length}
          icon={Users}
          colorTheme="success"
        />
        <StatsCard
          title={t('hr.monthlyPayroll')}
          value={`₹${totalMonthlyPayroll.toLocaleString()}`}
          icon={CreditCard}
          colorTheme="secondary"
        />
        <StatsCard
          title={t('hr.pendingDues')}
          value={`₹${totalPendingDues.toLocaleString()}`}
          icon={IndianRupee}
          colorTheme="warning"
        />
      </div>

      {/* Main Table Card */}
      <div className="flex-1 min-h-[400px] bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg whitespace-nowrap">
            <Users className="w-5 h-5 text-primary" />
            <span>{t('hr.staffDirectory')} ({filteredData.length})</span>
          </div>
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {roleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-[250px] shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, phone..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
        />
      </div>

      {/* Log Payment Modal */}
      {isPayModalOpen && payingStaff && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={t('hr.logPaymentTitle', { name: payingStaff.name })}
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
        onConfirm={confirmDelete}
        title={t('hr.deleteStaffTitle')}
        message={t('hr.deleteStaffMsg')}
      />

    </div>
  );
}
