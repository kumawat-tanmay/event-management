'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Loader2, Edit, Eye, Trash2, Search, Key } from 'lucide-react';
import { roleService, Role } from '@/lib/services/role.services';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

export default function RolesView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch Roles
  const { data: roles, isLoading, error, mutate: fetchRoles } = useSWR<Role[]>('roles', roleService.getRoles);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const calculatePermissionCount = (perms: string[]) => {
    if (!perms) return `0 ${t('roles.permissionsShort', 'Permissions')}`;
    if (perms.includes('*') || perms.includes('all')) return t('roles.fullAccess', 'Full System Access');
    return `${perms.length} ${t('roles.permissionsShort', 'Permissions')}`;
  };

  const handleDeleteClick = (id: string) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting role...');
    try {
      await roleService.deleteRole(roleToDelete);
      toast.success(t('roles.deleteSuccess', 'Role deleted successfully'), { id: toastId });
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || t('roles.deleteFail', 'Failed to delete role'), { id: toastId });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  // Filtered Roles
  const filteredRoles = roles?.filter(role => 
    role.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    {
      header: t('roles.roleName', 'Role Name'),
      accessorKey: 'name',
      cell: (row: Role) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-foreground block">{row.name}</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {row.isSystem ? t('roles.systemDefault', 'System Default') : t('roles.customRole', 'Custom Role')}
            </span>
          </div>
        </div>
      )
    },
    {
      header: t('roles.accessLevel', 'Access Level'),
      accessorKey: 'permissions',
      cell: (row: Role) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <Key className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{calculatePermissionCount(row.permissions)}</span>
        </div>
      )
    },
    {
      header: t('roles.status', 'Status'),
      accessorKey: 'isActive',
      cell: (row: Role) => (
        <StatusBadge status={row.isSystem ? 'Available' : 'Confirmed'} customText={row.isSystem ? t('roles.active', 'Active') : t('roles.custom', 'Custom')} />
      )
    },
    {
      header: t('common.actions', 'Actions'),
      accessorKey: 'actions',
      cell: (row: Role) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/settings/roles/${row._id}`)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={t('common.view', 'View Details')}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {!row.isSystem && (
            <ActionGuard permission="roles.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/settings/roles/${row._id}/edit`)}
                className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                title={t('roles.editRole', 'Edit Role')}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </ActionGuard>
          )}

          {!row.isSystem && (
            <ActionGuard permission="roles.delete">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(row._id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                title={t('roles.deleteRole', 'Delete Role')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </ActionGuard>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load roles.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {t('roles.title', 'Roles & Permissions')}
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {t('roles.subtitle', 'Manage access controls and administrative roles across the platform.')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ActionGuard permission="roles.create">
            <Button 
              variant="primary" 
              className="flex items-center gap-2"
              onClick={() => router.push('/settings/roles/new')}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t('roles.addRole', 'Create Custom Role')}</span>
            </Button>
          </ActionGuard>
        </div>
      </div>

      {/* Unified List Panel */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border flex flex-col">
        {/* Search Header */}
        <div className="p-4 bg-muted/10 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search', 'Search') + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto bg-background">
          {filteredRoles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t('common.noData', 'No roles found.')}
            </div>
          ) : (
            <DataTable
              data={filteredRoles}
              columns={columns}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('roles.deleteRole', 'Delete Role')}
        message={t('roles.deleteConfirmMsg', 'Are you sure you want to delete this role? This cannot be undone.')}
        confirmText={t('roles.deleteRole', 'Delete')}
      />
    </div>
  );
}
