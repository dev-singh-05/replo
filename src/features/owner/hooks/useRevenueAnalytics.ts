import { useQuery } from '@/src/core/hooks/useQuery';
import { dashboardApi } from '../api/dashboard.api';
import type { RevenueSummary } from '../types';

export function useRevenueAnalytics() {
    return useQuery<RevenueSummary>({
        fetcher: dashboardApi.fetchRevenueSummary,
        allowedRoles: ['owner'],
    });
}
