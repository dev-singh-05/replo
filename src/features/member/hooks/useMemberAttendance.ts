// ============================================================
// Replo — useMemberAttendance Hook
// Paginated attendance history with month filter
// ============================================================

import { usePaginatedQuery } from '@/src/core/hooks/usePaginatedQuery';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { memberAttendanceApi } from '../api/member.api';
import type { AttendanceFilters, MemberAttendance } from '../types';
import { MEMBER_ROLE } from '../types';

export function useMemberAttendance() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [filters, setFilters] = useState<AttendanceFilters>({ month: currentMonth });

    const list = usePaginatedQuery<MemberAttendance>({
        fetcher: (range) =>
            memberAttendanceApi.fetchHistory({
                from: range.from,
                to: range.to,
                limit: range.limit,
                filters,
            }),
        limit: 20,
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [filters.month],
    });

    const visitCount = useQuery<number>({
        fetcher: () => memberAttendanceApi.getMonthlyVisitCount(filters.month),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [filters.month],
    });

    const setMonth = useCallback((month: string) => {
        setFilters({ month });
    }, []);

    return {
        attendance: list,
        monthlyVisits: visitCount.data ?? 0,
        filters,
        setMonth,
    };
}
