import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { staffAttendanceApi } from '../api/staff.api';
import type { StaffAttendance, StaffMember } from '../types';
import { STAFF_ROLES } from '../types';

/**
 * Attendance operations: active checkins, check-in, check-out, member search.
 */
export function useAttendance() {
    const [searchResults, setSearchResults] = useState<StaffMember[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const activeCheckins = useQuery<StaffAttendance[]>({
        fetcher: staffAttendanceApi.fetchActiveCheckins,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    const checkIn = useMutation<StaffAttendance, string>({
        mutationFn: staffAttendanceApi.checkIn,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    const checkOut = useMutation<StaffAttendance, string>({
        mutationFn: staffAttendanceApi.checkOut,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    const searchMembers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await staffAttendanceApi.searchMembers(query);
            setSearchResults(results);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    return {
        activeCheckins,
        checkIn,
        checkOut,
        searchMembers,
        searchResults,
        isSearching,
    };
}
