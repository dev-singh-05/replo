import { useMutation } from '@/src/core/hooks/useMutation';
import { usePaginatedQuery } from '@/src/core/hooks/usePaginatedQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { staffEquipmentReportsApi } from '../api/staff.api';
import type { ReportFilters, StaffEquipmentReport } from '../types';
import { STAFF_ROLES } from '../types';

/**
 * Equipment reports: paginated list with severity/status filter, status mutations.
 */
export function useEquipmentReports() {
    const [filters, setFilters] = useState<ReportFilters>({});

    const setSeverityFilter = useCallback((severity: string | undefined) => {
        setFilters((prev) => ({ ...prev, severity }));
    }, []);

    const setStatusFilter = useCallback((status: string | undefined) => {
        setFilters((prev) => ({ ...prev, status }));
    }, []);

    const list = usePaginatedQuery<StaffEquipmentReport>({
        fetcher: ({ from, to, limit }) =>
            staffEquipmentReportsApi.fetchList({ from, to, limit, filters }),
        limit: 20,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [filters.severity, filters.status],
    });

    const markInProgress = useMutation<StaffEquipmentReport, string>({
        mutationFn: staffEquipmentReportsApi.markInProgress,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    const markResolved = useMutation<StaffEquipmentReport, string>({
        mutationFn: staffEquipmentReportsApi.markResolved,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    return {
        ...list,
        filters,
        setSeverityFilter,
        setStatusFilter,
        markInProgress,
        markResolved,
    };
}
