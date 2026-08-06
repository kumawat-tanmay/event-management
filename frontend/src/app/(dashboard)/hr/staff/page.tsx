import React from 'react';
import { Metadata } from 'next';
import { StaffView } from '@/components/dashboard/hr/staff/StaffView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Staff Directory',
  description: 'Manage staff profiles, work assignments, attendance, and team roles.',
  url: '/hr/staff',
});

export default function StaffPage() {
  return <StaffView />;
}
