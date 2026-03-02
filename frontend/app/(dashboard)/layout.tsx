'use client'

import { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface DashboardRouteLayoutProps {
  children: ReactNode;
}

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}