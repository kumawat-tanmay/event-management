'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Shield, Layers, Key, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import useSWR from 'swr';
import { roleService } from '@/lib/services/role.services';
import { PERMISSION_MODULES } from '@/lib/constants/permissions';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export function RoleDetailView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Fetch single role details
  const { data: role, isLoading, error } = useSWR(
    id ? `role-detail-${id}` : null,
    () => roleService.getRoleById(id)
  );

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="p-6 text-center text-error">
        {t('roles.failedLoad', 'Failed to load role details.')}
      </div>
    );
  }

  const isFullAccess = role.permissions?.includes('*') || role.permissions?.includes('all');

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              {role.name}
              <StatusBadge status={role.isSystem ? 'Available' : 'Confirmed'} customText={role.isSystem ? 'System Default' : 'Custom'} className="mt-1" />
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!role.isSystem && (
            <ActionGuard permission="roles.update">
              <Button 
                variant="primary" 
                className="flex items-center gap-2"
                onClick={() => router.push(`/settings/roles/${role._id}/edit`)}
              >
                <Edit className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('roles.editRole', 'Edit Role')}</span>
              </Button>
            </ActionGuard>
          )}
        </div>
      </div>

      {/* Unified Details Panel (Form Style Sheet) */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
        {/* Section 1: Basic Information */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Layers className="w-5 h-5 text-primary" />
            <h2>{t('roles.basicInfo', 'Role Information')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('roles.roleName', 'Role Name')}</label>
              <div className="flex h-12 items-center px-4 font-semibold text-foreground bg-muted/10 border border-border rounded-xl">
                {role.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('roles.accessLevel', 'Access Level')}</label>
              <div className="flex h-12 items-center px-4 font-bold text-emerald-600 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                {isFullAccess ? t('roles.fullAccessDesc', 'Full Administrator (All System Access)') : `${role.permissions?.length || 0} ${t('roles.assignedShort', 'Permissions Assigned')}`}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Permissions Configuration Matrix (Read-only view) */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-6">
            <Key className="w-5 h-5 text-primary" />
            <h2>{t('roles.permissions', 'Permissions Matrix')}</h2>
          </div>

          {isFullAccess ? (
            <div className="p-8 text-center bg-emerald-500/5 border border-emerald-500/25 rounded-2xl text-emerald-700 font-bold text-sm">
              {t('roles.fullAccessNotice', 'This role has full system privileges (*) and can perform all operations across all modules.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PERMISSION_MODULES.map(mod => {
                const activePerms = mod.permissions.filter(p => role.permissions?.includes(p.key));
                
                return (
                  <div key={mod.module} className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-foreground capitalize border-b border-border pb-2">
                      {t(`permissions.module.${mod.module}`, mod.label)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activePerms.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                          {t('roles.noAccess', 'No access granted')}
                        </span>
                      ) : (
                        activePerms.map(p => (
                          <span 
                            key={p.key} 
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-1 rounded-lg"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            {t(`permissions.key.${p.key}`, p.label)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
