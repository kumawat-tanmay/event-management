'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ActionGuard } from '@/components/auth/ActionGuard';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/services/auth.services';
import { toast } from 'react-hot-toast';
import { Camera, User, Lock, Save, Loader2 } from 'lucide-react';

export const UserProfileView = () => {
  const { user, token, login, role } = useAuth();

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');

    try {
      setIsUpdatingProfile(true);
      const formData = new FormData();
      formData.append('name', name);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await authService.updateProfile(formData);
      if (res.success) {
        toast.success(res.message || 'Profile updated successfully');
        // Update Redux state
        login(res.data, res.data.token || token);
        setAvatarFile(null); // Clear file after upload
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Please enter your current password');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    try {
      setIsUpdatingPassword(true);
      const res = await authService.updatePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success(res.message || 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Update token in Redux if it rotated
        if (res.data?.token) {
          login(user!, res.data.token);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-muted-foreground text-lg">Manage your personal information and account security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card A: Personal Info */}
        <Card className="shadow-lg border-gray-200/60 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600 w-full" />
          <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-xl flex items-center gap-3 font-semibold text-gray-900 dark:text-gray-100">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <User className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleProfileSubmit} className="space-y-7">
              
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-28 w-28 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white dark:border-gray-800"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mt-1">Recommended: Square JPG, PNG. Max 5MB.</p>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">Full Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your name" 
                    className="h-11 shadow-sm border-gray-300 dark:border-gray-700 focus-visible:ring-amber-500"
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">Email Address (Read-only)</label>
                  <Input 
                    value={user?.email || ''} 
                    disabled 
                    className="h-11 bg-muted/80 text-foreground font-medium opacity-100 cursor-not-allowed shadow-inner border-gray-200 dark:border-gray-800" 
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">Contact your administrator to change your email.</p>
                </div>

                <div className="space-y-1.5 pt-3">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">Current Role</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-5 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-900 dark:text-amber-300 text-sm font-bold rounded-full capitalize border border-amber-200 dark:border-amber-700/50 shadow-sm flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      {role || 'Staff'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <ActionGuard permission="dashboard.view">
                  <Button type="submit" disabled={isUpdatingProfile || (!name.trim())} className="h-11 px-8 bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-base font-medium rounded-xl">
                    {isUpdatingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Changes
                  </Button>
                </ActionGuard>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card B: Security */}
        <Card className="shadow-lg border-gray-200/60 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-xl h-fit">
          <div className="h-2 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 w-full" />
          <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-xl flex items-center gap-3 font-semibold text-gray-900 dark:text-gray-100">
              <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                <Lock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-xl mb-6 border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <p>If you logged in using Google, you may not have a traditional password set up unless you created one previously.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">Current Password</label>
                  <Input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-11 shadow-sm border-gray-300 dark:border-gray-700 focus-visible:ring-gray-500"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">New Password</label>
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-11 shadow-sm border-gray-300 dark:border-gray-700 focus-visible:ring-gray-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 block">Confirm New Password</label>
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-11 shadow-sm border-gray-300 dark:border-gray-700 focus-visible:ring-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <ActionGuard permission="dashboard.view">
                  <Button type="submit" disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword} className="h-11 px-8 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-base font-medium rounded-xl">
                    {isUpdatingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                    Update Password
                  </Button>
                </ActionGuard>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
