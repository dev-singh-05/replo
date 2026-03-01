import { useMutation } from '@/src/core/hooks/useMutation';
import { usePaginatedQuery } from '@/src/core/hooks/usePaginatedQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { staffMembersApi } from '../api/staff.api';
import type { CreateMemberInput, CreateMemberResult, MemberFilters, StaffMember } from '../types';
import { MUTATION_ROLES, STAFF_ROLES } from '../types';

/**
 * Debounced, paginated, filterable member list.
 */
export function useMembers() {
    const [filters, setFilters] = useState<MemberFilters>({});
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setSearch = useCallback((text: string) => {
        setFilters((prev) => ({ ...prev, search: text }));
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setDebouncedSearch(text);
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const setStatusFilter = useCallback((status: string | undefined) => {
        setFilters((prev) => ({ ...prev, status }));
    }, []);

    const list = usePaginatedQuery<StaffMember>({
        fetcher: ({ from, to, limit }) =>
            staffMembersApi.fetchList({
                from,
                to,
                limit,
                filters: { ...filters, search: debouncedSearch },
            }),
        limit: 20,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [debouncedSearch, filters.status],
    });

    const createMember = useMutation<CreateMemberResult, CreateMemberInput>({
        mutationFn: staffMembersApi.create,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const sendGymRequest = useMutation<any, string>({
        mutationFn: staffMembersApi.sendGymRequest,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const suspendMember = useMutation<StaffMember, string>({
        mutationFn: staffMembersApi.suspend,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const reactivateMember = useMutation<StaffMember, string>({
        mutationFn: staffMembersApi.reactivate,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    return {
        ...list,
        filters,
        setSearch,
        setStatusFilter,
        createMember,
        sendGymRequest,
        suspendMember,
        reactivateMember,
    };
}
