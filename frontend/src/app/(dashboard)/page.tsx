import React from 'react';
import { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/dashboard/DashboardView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Dashboard Overview',
  description: 'Enterprise ERP dashboard for Krishna Tent & Events — manage event bookings, stock reservations, warehouse dispatches, site execution, and financial ledgers.',
  url: '/',
});

export default function DashboardPage() {
  return (
    <DashboardView />
  );
}
