import { useQuery } from '@/src/core/hooks/useQuery';
import { dashboardApi } from '../api/dashboard.api';
import type { AttendanceSummary } from '../types';

export function useAttendanceAnalytics() {
    return useQuery<AttendanceSummary>({
        fetcher: dashboardApi.fetchAttendanceSummary,
        allowedRoles: ['owner'],
    });
}
