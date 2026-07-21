"use client";

import React from 'react';
import nextDynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  );
}

const AnalyticsClient = nextDynamic(() => import('@/components/blocks/admin/AnalyticsClient'), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />,
});

interface AnalyticsClientWrapperProps {
  totalRevenue: number;
  totalOrders: number;
  averageBasket: number;
  revenueData: Array<{
    name: string;
    'Revenus (CFA)': number;
    'Commandes': number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function AnalyticsClientWrapper(props: AnalyticsClientWrapperProps) {
  return <AnalyticsClient {...props} />;
}
