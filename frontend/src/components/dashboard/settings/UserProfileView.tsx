'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Save, Upload, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, FileText, Image as ImageIcon, Camera, User, Lock, Loader2, Calendar, UserCheck, Key, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/services/auth.services';
import { userService } from '@/lib/services/user.services';
import { roleService, Role } from '@/lib/services/role.services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

export function UserProfileView() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isIdMode = !!id;

  const { user, token, login, role, logout } = useAuth();

  // Profile States
  const [isEditing, setIsEditing] = useState(isIdMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [description, setDescription] = useState('');

  // ID mode specific states
  const [roleName, setRoleName] = useState('');
  const [status, setStatus] = useState('Active');
  const [isActive, setIsActive] = useState(true);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch target User details for ID mode
  const { data: fetchedUser, isLoading: userLoading, mutate: mutateUser } = useSWR(
    isIdMode ? `user-profile-${id}` : null,
    () => userService.getUserById(id)
  );

  // Fetch Roles list for ID mode
  const { data: roles } = useSWR<Role[]>(
    isIdMode ? 'roles' : null,
    roleService.getRoles
  );

  const displayedUser = isIdMode ? fetchedUser : user;

  // Populate state on load or when user data changes
  useEffect(() => {
    if (displayedUser) {
      setName(displayedUser.name || '');
      setPhone(displayedUser.phone || '');
      setAddress(displayedUser.address || '');
      setDob(displayedUser.dob ? new Date(displayedUser.dob).toISOString().split('T')[0] : '');
      setGender(displayedUser.gender || '');
      setDescription(displayedUser.description || '');
      setAvatarPreview(displayedUser.avatar || null);

      if (isIdMode) {
        const userRole = displayedUser.role;
        const roleStr = (typeof userRole === 'object' && userRole !== null && 'name' in userRole)
          ? (userRole as { name: string }).name
          : (typeof userRole === 'string' ? userRole : '');
        setRoleName(roleStr || '');
        setStatus(displayedUser.status || (displayedUser.isActive ? 'Active' : 'Inactive'));
        setIsActive(displayedUser.isActive !== false);
      }
    }
  }, [displayedUser, isIdMode]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isIdMode) return; // Admins don't upload avatars for other users here
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelProfile = () => {
    if (isIdMode) {
      router.push('/settings/users');
      return;
    }
    if (displayedUser) {
      setName(displayedUser.name || '');
      setPhone(displayedUser.phone || '');
      setAddress(displayedUser.address || '');
      setDob(displayedUser.dob ? new Date(displayedUser.dob).toISOString().split('T')[0] : '');
      setGender(displayedUser.gender || '');
      setDescription(displayedUser.description || '');
      setAvatarPreview(displayedUser.avatar || null);
      setAvatarFile(null);
    }
    setIsEditing(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');

    setIsUpdatingProfile(true);
    const toastId = toast.loading(isIdMode ? 'Saving user changes...' : 'Saving profile changes...');
    try {
      if (isIdMode) {
        // Admin updates another user's profile details
        await userService.updateUser(id, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          dob: dob || undefined,
          gender,
          description: description.trim(),
          role: roleName,
          status,
          isActive
        });
        toast.success('User updated successfully', { id: toastId });
        mutateUser();
        setIsEditing(false);
        router.push('/settings/users');
      } else {
        // Logged-in user updates their own profile
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('phone', phone.trim());
        formData.append('address', address.trim());
        formData.append('dob', dob || '');
        formData.append('gender', gender);
        formData.append('description', description.trim());
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }

        const res = await authService.updateProfile(formData);
        if (res.success) {
          toast.success(res.message || 'Profile updated successfully', { id: toastId });
          login(res.data, res.data.token || token);
          setAvatarFile(null);
          setIsEditing(false);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save changes', { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (isIdMode && userLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleProfileSubmit} className="flex flex-col p-4 md:p-6 lg:p-8 w-full pb-16">
      {/* Main Single Unified Card Sheet */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden divide-y divide-border">
        {/* ─── Top Header Section ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 md:p-8 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-4">
            {isIdMode && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings/users')}
                className="shrink-0"
                disabled={isUpdatingProfile}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-12 h-12 rounded-2xl bg-[#8a5a32]/10 text-[#8a5a32] dark:text-[#c28854] flex items-center justify-center font-bold shrink-0">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight">
                {isIdMode ? 'Edit User Profile' : 'My Profile'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIdMode 
                  ? `Update profile details and role configurations for ${name || 'user'}.`
                  : 'Manage your personal profile details, contact information, and security.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelProfile}
                  disabled={isUpdatingProfile}
                  className="rounded-xl px-5 py-2.5"
                >
                  {t('profile.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 shrink-0"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  {t('profile.saveChanges', 'Save Changes')}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="rounded-xl px-6 py-2.5 shrink-0"
              >
                {t('profile.editProfile', 'Edit Profile')}
              </Button>
            )}
          </div>
        </div>
        {/* Section 1: Personal Information */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2>{t('profile.personalInfo', 'Personal Information')}</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className={`relative group w-32 h-32 rounded-full border-4 border-card shadow-lg flex items-center justify-center bg-muted/40 overflow-hidden ${!isIdMode && isEditing ? 'cursor-pointer' : ''}`}
                onClick={() => !isIdMode && isEditing && fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  /* eslint-disable-next-next/no-img-element */
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-muted-foreground opacity-60" />
                )}
                {!isIdMode && isEditing && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold">
                    <Camera size={20} className="mb-1" />
                    <span>Upload</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{t('profile.recommendSize', 'Recommended: JPG/PNG (Max 5MB)')}</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={!isEditing || isIdMode}
              />
            </div>

            {/* Form Fields Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.fullName', 'Full Name')} *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="rounded-xl font-medium"
                  required
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.email', 'Email Address (Read-only)')}</label>
                <Input
                  value={displayedUser?.email || ''}
                  disabled
                  className="rounded-xl font-medium bg-muted/20 opacity-80 cursor-not-allowed"
                />
              </div>

              {isIdMode ? (
                /* Editable role dropdown for admin in ID mode */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.roleAssignment', 'Role Assignment')} *</label>
                  {isEditing ? (
                    <select
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      disabled={!isEditing}
                      required
                      className="flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                      <option value="" disabled>Select role...</option>
                      {(roles || []).map(r => (
                        <option key={r._id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center h-10 px-3 bg-muted/10 border border-border rounded-xl font-semibold text-sm text-foreground capitalize">
                      <Shield className="w-3.5 h-3.5 text-primary mr-2" />
                      {roleName || 'Staff'}
                    </div>
                  )}
                </div>
              ) : (
                /* Read-only role display for self profile */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.currentRole', 'Current Role')}</label>
                  <div className="flex items-center h-10 px-3 bg-muted/10 border border-border rounded-xl font-semibold text-sm text-foreground capitalize">
                    <Shield className="w-3.5 h-3.5 text-primary mr-2" />
                    {role || 'Staff'}
                  </div>
                </div>
              )}

              {isIdMode && (
                /* Editable status/active settings in ID mode */
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.status', 'Status')}</label>
                    {isEditing ? (
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={!isEditing}
                        required
                        className="flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                      >
                        <option value="Active">{t('profile.active', 'Active')}</option>
                        <option value="Pending">{t('profile.pending', 'Pending')}</option>
                        <option value="Inactive">{t('profile.inactive', 'Inactive')}</option>
                      </select>
                    ) : (
                      <div className="flex items-center h-10 px-3 bg-muted/10 border border-border rounded-xl font-semibold text-sm text-foreground capitalize">
                        {status === 'Active' ? t('profile.active', 'Active') : status === 'Pending' ? t('profile.pending', 'Pending') : t('profile.inactive', 'Inactive')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 disabled:opacity-50"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-foreground cursor-pointer disabled:opacity-50">
                      {t('profile.accountActive', 'Account Active (Access Granted)')}
                    </label>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.contactPhone', 'Contact Phone')}</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98290 12345"
                  className="rounded-xl font-medium"
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.dob', 'Date of Birth')}</label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="rounded-xl font-medium"
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.gender', 'Gender')}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={!isEditing}
                  className="flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium disabled:opacity-50"
                >
                  <option value="">{t('profile.selectGender', 'Select Gender...')}</option>
                  <option value="Male">{t('profile.male', 'Male')}</option>
                  <option value="Female">{t('profile.female', 'Female')}</option>
                  <option value="Other">{t('profile.other', 'Other')}</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.bio', 'Profile Description / Bio')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your role, specialization, or event execution experience..."
                  rows={3}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{t('profile.address', 'Home Address')}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete home address details..."
                  rows={2}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Account Security - Only visible for self profile */}
        {!isIdMode && (
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2>{t('profile.security', 'Security Settings')}</h2>
            </div>

            <div className="max-w-xl space-y-4">
              <p className="text-sm text-muted-foreground font-medium">
                {t('profile.changePasswordDesc', 'To change or reset your account password, please proceed to the secure authentication reset page.')}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => logout()}
                className="rounded-xl px-5 py-2.5 flex items-center gap-2"
              >
                <Key className="w-4.5 h-4.5 text-muted-foreground" />
                {t('profile.resetPassword', 'Reset / Change Password')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
