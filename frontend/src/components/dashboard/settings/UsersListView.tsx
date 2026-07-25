'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, UserPlus, Mail, Shield } from 'lucide-react';
import { userService, User } from '@/lib/services/user.services';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import { InviteUserModal } from './InviteUserModal';

export default function UsersListView() {
  const { data: users, error, mutate, isLoading } = useSWR<User[]>('users', userService.getUsers);
  const { hasPermission } = usePermissions();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Check if current user has permission to invite users
  const canInvite = hasPermission('users.create');

  if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-error p-4">Failed to load users.</div>;

  const columns = [
    { 
      header: 'Name', 
      accessorKey: 'name',
      cell: (row: User) => (
        <div className="font-medium text-foreground">{row.name}</div>
      )
    },
    { 
      header: 'Email', 
      accessorKey: 'email',
      cell: (row: User) => (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Mail className="w-3.5 h-3.5" />
          {row.email}
        </div>
      )
    },
    { 
      header: 'Role', 
      accessorKey: 'role',
      cell: (row: User) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-3.5 h-3.5 text-primary" />
          {row.role}
        </div>
      )
    },
    {
      header: 'Invited By',
      accessorKey: 'invitedBy',
      cell: (row: User) => (
        <div className="text-sm text-muted-foreground">
          {row.invitedBy ? row.invitedBy.name : '-'}
        </div>
      )
    },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (row: User) => {
        const badgeStatus = row.status || (row.isActive ? 'Active' : 'Inactive');
        return <StatusBadge status={badgeStatus} />;
      }
    }
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-display">User Management</h2>
        {canInvite && (
          <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
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
    </div>
  );
}
