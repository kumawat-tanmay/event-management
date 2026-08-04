'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Shield, Key } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import useSWR from 'swr';
import { roleService } from '@/lib/services/role.services';
import { PERMISSION_MODULES } from '@/lib/constants/permissions';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function RoleFormView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch role details for editing
  const { data: role, isLoading: itemLoading } = useSWR(
    isEditing ? `role-form-${id}` : null,
    () => roleService.getRoleById(id)
  );

  // Populate form states when editing
  useEffect(() => {
    if (isEditing && role) {
      setName(role.name || '');
      setPermissions(role.permissions || []);
    }
  }, [isEditing, role]);

  const togglePermission = (key: string) => {
    setPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleModulePermissions = (moduleKeys: string[]) => {
    const allSelected = moduleKeys.every(k => permissions.includes(k));
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !moduleKeys.includes(p)));
    } else {
      setPermissions(prev => {
        const newPerms = [...prev];
        moduleKeys.forEach(k => {
          if (!newPerms.includes(k)) newPerms.push(k);
        });
        return newPerms;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(isEditing ? 'Updating role...' : 'Creating role...');
    try {
      if (isEditing) {
        await roleService.updateRole(id, { name: name.trim(), permissions });
        toast.success('Role updated successfully', { id: toastId });
      } else {
        await roleService.createRole({ name: name.trim(), permissions });
        toast.success('Role created successfully', { id: toastId });
      }
      router.push('/settings/roles');
    } catch (err: any) {
      console.error('Error saving role:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save role', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && itemLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
            disabled={isSaving}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isEditing ? 'Edit Role' : 'Create Custom Role'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            {t('roles.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </div>

      {/* Unified Form Panel */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
        {/* Section 1: Basic Info */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2>Role Information</h2>
          </div>

          <div className="max-w-md space-y-4">
            <Input
              label="Role Name *"
              placeholder="e.g. Accountant, Store Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Section 2: Permissions Configurations */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
            <Key className="w-5 h-5 text-primary" />
            <h2>Configure Access Levels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PERMISSION_MODULES.map(module => {
              const moduleKeys = module.permissions.map(p => p.key);
              const allSelected = moduleKeys.every(k => permissions.includes(k));
              
              return (
                <div 
                  key={module.module} 
                  className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-bold text-foreground capitalize">
                      {t(`permissions.module.${module.module}`, module.label)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleModulePermissions(moduleKeys)}
                      disabled={isSaving}
                      className="text-xs font-semibold text-primary hover:text-primary-focus transition-colors disabled:opacity-50"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {module.permissions.map(perm => (
                      <label 
                        key={perm.key} 
                        className="flex items-start gap-3 cursor-pointer group text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                          disabled={isSaving}
                          className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                          {t(`permissions.key.${perm.key}`, perm.label)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
