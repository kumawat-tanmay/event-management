'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Shield, Plus, Loader2, Save, Trash2 } from 'lucide-react';
import { roleService, Role } from '@/lib/services/role.services';
import { PERMISSION_MODULES } from '@/lib/constants/permissions';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ActionGuard } from '@/components/auth/ActionGuard';

export default function RolesView() {
  const { t } = useTranslation();
  const { data: roles, isLoading, error, mutate: fetchRoles } = useSWR<Role[]>('roles', roleService.getRoles);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  // Auto-select first role when roles data loads
  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRole && !isCreating) {
      const firstRole = roles[0];
      setSelectedRole(firstRole);
      setName(firstRole.name);
      setPermissions(firstRole.permissions || []);
    }
  }, [roles, selectedRole, isCreating]);

  const handleSelectRole = (role: Role) => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedRole(role);
    setName(role.name);
    setPermissions(role.permissions || []);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setIsCreating(true);
    setIsEditing(true);
    setName('');
    setPermissions([]);
  };

  const togglePermission = (key: string) => {
    if (!isEditing) return;
    setPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleModulePermissions = (moduleKeys: string[]) => {
    if (!isEditing) return;
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

  const handleSave = async () => {
    if (!name.trim()) return toast.error(t('roles.nameRequired', 'Role name is required'));
    setIsSaving(true);
    try {
      if (isCreating) {
        const newRole = await roleService.createRole({ name, permissions });
        toast.success(t('roles.createSuccess', 'Role created successfully'));
        const updatedRoles = await fetchRoles();
        if (updatedRoles) {
          const created = updatedRoles.find((r: Role) => r._id === newRole._id);
          if (created) handleSelectRole(created);
        }
      } else if (selectedRole) {
        await roleService.updateRole(selectedRole._id, { name, permissions });
        toast.success(t('roles.updateSuccess', 'Role updated successfully'));
        const updatedRoles = await fetchRoles();
        if (updatedRoles) {
          const updated = updatedRoles.find((r: Role) => r._id === selectedRole._id);
          if (updated) handleSelectRole(updated);
        }
      }
    } catch (err: any) {
      toast.error(err.message || t('roles.saveFail', 'Failed to save role'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await roleService.deleteRole(roleToDelete);
      toast.success(t('roles.deleteSuccess', 'Role deleted'));
      if (selectedRole?._id === roleToDelete) {
        setSelectedRole(null);
      }
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || t('roles.deleteFail', 'Failed to delete role'));
    } finally {
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-error p-4">{t('roles.failedLoad', 'Failed to load roles.')}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-6">
      {/* Sidebar: Roles List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">{t('roles.title')}</h2>
          <ActionGuard permission="roles.create">
            <Button onClick={handleCreateNew} size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> {t('roles.addRole')}
            </Button>
          </ActionGuard>
        </div>
        <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 shadow-sm">
          {roles?.map((role: Role) => (
            <button
              key={role._id}
              onClick={() => handleSelectRole(role)}
              className={`text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                selectedRole?._id === role._id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span>{role.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel: Editor */}
      <div className="w-full md:w-2/3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        {(selectedRole || isCreating) ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {isCreating ? t('roles.addRole') : selectedRole?.name}
                </h3>
              </div>
              <div className="flex gap-2">
                {selectedRole && (
                  <ActionGuard permission="roles.delete">
                    <Button variant="outline" onClick={() => handleDeleteClick(selectedRole._id)} className="text-error border-error/20 hover:bg-error/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </ActionGuard>
                )}
                {selectedRole && !isEditing && (
                  <ActionGuard permission="roles.update">
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      {t('roles.editRole')}
                    </Button>
                  </ActionGuard>
                )}
                {isEditing && (
                  <ActionGuard permission="roles.update">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {t('roles.saveRole')}
                    </Button>
                  </ActionGuard>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('roles.roleName')}</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Area Manager" 
                  disabled={!isEditing}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{t('roles.permissions')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {PERMISSION_MODULES.map(module => {
                    const moduleKeys = module.permissions.map(p => p.key);
                    const allSelected = moduleKeys.every(k => permissions.includes(k) || permissions.includes('*'));
                    return (
                      <div key={module.module} className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                            {t(`permissions.module.${module.module}`, module.label)}
                          </h5>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(moduleKeys)}
                            disabled={!isEditing || permissions.includes('*')}
                            className="text-[11px] font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:hover:text-primary transition-colors"
                          >
                            {allSelected ? t('roles.deselectAll') : t('roles.selectAll')}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {module.permissions.map(perm => (
                            <label key={perm.key} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={permissions.includes(perm.key) || permissions.includes('*')}
                                onChange={() => togglePermission(perm.key)}
                                disabled={!isEditing || permissions.includes('*')}
                                className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary disabled:opacity-50"
                              />
                              <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
            <Shield className="w-16 h-16 mb-4 text-zinc-200 dark:text-zinc-800" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">{t('roles.noRoleSelected')}</h3>
            <p className="max-w-sm">{t('roles.noRoleSelectedSub')}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('roles.deleteRole')}
        message={t('roles.deleteConfirmMsg')}
        confirmText={t('roles.deleteRole')}
      />
    </div>
  );
}
