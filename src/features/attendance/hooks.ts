import { useMutation } from '@/src/core/hooks/useMutation';
import { usePaginatedQuery } from '@/src/core/hooks/usePaginatedQuery';
import { attendanceApi } from './api';

// ------------------------------------------------------------------
// Reusable React Hooks for the Attendance feature
// ------------------------------------------------------------------

export function useAttendanceList(limit = 20) {
    return usePaginatedQuery({
        fetcher: attendanceApi.fetchList,
        limit,
        allowedRoles: ['owner', 'manager', 'trainer', 'receptionist']
    });
}

export function useCheckIn() {
    return useMutation({
        mutationFn: (member_id: string) => attendanceApi.checkIn(member_id),
        allowedRoles: ['owner', 'manager', 'receptionist', 'trainer', 'member'] // Member can check themselves in
    });
}

export function useCheckOut() {
    return useMutation({
        mutationFn: (id: string) => attendanceApi.checkOut(id),
        allowedRoles: ['owner', 'manager', 'receptionist', 'trainer', 'member']
    });
}
