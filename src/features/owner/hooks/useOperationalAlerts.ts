import { useQuery } from '@/src/core/hooks/useQuery';
import { dashboardApi } from '../api/dashboard.api';
import type { OperationalAlerts } from '../types';

export function useOperationalAlerts() {
    return useQuery<OperationalAlerts>({
        fetcher: dashboardApi.fetchOperationalAlerts,
        allowedRoles: ['owner'],
    });
}
