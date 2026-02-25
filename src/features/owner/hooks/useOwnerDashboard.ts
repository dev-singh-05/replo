import { useQuery } from '@/src/core/hooks/useQuery';
import { dashboardApi } from '../api/dashboard.api';
import type { OverviewMetrics } from '../types';

export function useOwnerDashboard() {
    return useQuery<OverviewMetrics>({
        fetcher: dashboardApi.fetchOverviewMetrics,
        allowedRoles: ['owner'],
    });
}
