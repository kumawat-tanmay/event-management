'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, UserPlus, Mail, Shield, Edit, X, Save } from 'lucide-react';
import { userService, User } from '@/lib/services/user.services';
import { roleService, Role } from '@/lib/services/role.services';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { InviteUserModal } from './InviteUserModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function UsersListView() {
  const { t } = useTranslation();
  const { data: users, error, mutate, isLoading } = useSWR<User[]>('users', userService.getUsers);
  const { data: roles } = useSWR<Role[]>('roles', roleService.getRoles);
  const { hasPermission } = usePermissions();
  const { role: currentUserRole } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Role Edit Modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Only Owner/Admin can invite
  const isAdminOrOwner = currentUserRole === 'Owner' || currentUserRole === 'Admin';

  const handleOpenRoleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role || '');
  };

  const handleSaveRole = async () => {
    if (!editingUser || !selectedRole) return;
    setIsUpdatingRole(true);
    try {
      await userService.updateUser(editingUser._id, { role: selectedRole });
      toast.success(`Role updated to "${selectedRole}" successfully`);
      setEditingUser(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-error p-4">{t('common.failedLoad', 'Failed to load users.')}</div>;

  const columns = [
    {
      header: t('profile.fullName', 'Full Name'),
      accessorKey: 'name',
      cell: (row: User) => (
        <div className="font-medium text-foreground">{row.name}</div>
      )
    },
    {
      header: t('company.email', 'Email Address'),
      accessorKey: 'email',
      cell: (row: User) => (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Mail className="w-3.5 h-3.5" />
          {row.email}
        </div>
      )
    },
    {
      header: t('roles.roleName', 'Role'),
      accessorKey: 'role',
      cell: (row: User) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-3.5 h-3.5 text-primary" />
          {row.role}
        </div>
      )
    },
    {
      header: t('users.invitedBy', 'Invited By'),
      accessorKey: 'invitedBy',
      cell: (row: User) => (
        <div className="text-sm text-muted-foreground">
          {row.invitedBy ? row.invitedBy.name : '-'}
        </div>
      )
    },
    {
      header: t('roles.status', 'Status'),
      accessorKey: 'status',
      cell: (row: User) => {
        const badgeStatus = row.status || (row.isActive ? 'Active' : 'Inactive');
        return <StatusBadge status={badgeStatus} customText={badgeStatus === 'Active' ? t('profile.active', 'Active') : badgeStatus === 'Pending' ? t('profile.pending', 'Pending') : t('profile.inactive', 'Inactive')} />;
      }
    },
    {
      header: t('common.actions', 'Actions'),
      accessorKey: 'actions',
      cell: (row: User) => (
        <div className="flex items-center justify-center gap-2">
          {isAdminOrOwner && !(currentUserRole === 'Admin' && row.role === 'Owner') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title={t('users.editRole', 'Edit Role')}
              onClick={() => handleOpenRoleEdit(row)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-display">{t('users.title', 'User Management')}</h2>
        {isAdminOrOwner && (
          <ActionGuard permission="users.create">
            <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2 shadow-sm">
              <UserPlus className="w-4 h-4" />
              {t('users.inviteUser', 'Invite User')}
            </Button>
          </ActionGuard>
        )}
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          data={users || []}
          columns={columns}
          className="p-0 border-0"
        />
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => mutate()}
      />

      {/* Role Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t('users.editRole', 'Edit Role')}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User</span>
                <p className="text-sm font-semibold text-foreground">{editingUser.name}</p>
                <p className="text-xs text-muted-foreground">{editingUser.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('profile.roleAssignment', 'Assign Role')}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isUpdatingRole}
                  className="flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>{t('profile.selectRole', 'Select a role...')}</option>
                  {roles?.map(r => (
                    <option key={r._id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={isUpdatingRole}>
                {t('profile.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={isUpdatingRole || !selectedRole || selectedRole === editingUser.role}
                className="gap-2"
              >
                {isUpdatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
