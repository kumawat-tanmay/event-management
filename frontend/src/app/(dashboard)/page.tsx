import React from 'react';
import { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/dashboard/DashboardView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Manage tent & event bookings, godown inventory, execution schedules, and financial reports from your ERP dashboard.',
  url: '/',
});

export default function DashboardPage() {
  return (
    <DashboardView />
  );
}
