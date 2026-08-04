import React, { useState } from 'react';
import useSWR from 'swr';
import { X, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { userService } from '@/lib/services/user.services';
import { roleService, Role } from '@/lib/services/role.services';
import { useTranslation } from 'react-i18next';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation();
  const { data: roles } = useSWR<Role[]>('roles', roleService.getRoles);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) return toast.error('Please fill in all fields');
    
    setIsSubmitting(true);
    try {
      await userService.inviteUser({ name, email, role });
      toast.success('Invitation sent successfully!');
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setRole('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border/50">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {t('users.inviteNewUser', 'Invite New User')}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('profile.fullName', 'Full Name')}</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. John Doe"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('company.email', 'Email Address')}</label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="john@example.com"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('profile.roleAssignment', 'Assign Role')}</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled className="bg-background text-foreground">{t('profile.selectRole', 'Select a role...')}</option>
                {roles?.map(r => (
                  <option key={r._id} value={r.name} className="bg-background text-foreground">{r.name}</option>
                ))}
              </select>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              {t('users.inviteDetails', 'An email will be sent to this address containing their temporary password and login instructions.')}
            </p>
          </div>
          
          <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('profile.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('users.sendInvitation', 'Send Invitation')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
