import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { staffAttendanceApi, staffContractsApi, staffMembersApi } from '../api/staff.api';
import type { MembershipContract, StaffAttendance, StaffMember } from '../types';
import { MUTATION_ROLES, STAFF_ROLES } from '../types';

/**
 * Full member detail: profile, contracts (membership), attendance history.
 */
export function useMemberDetail(memberId: string | null) {
    const member = useQuery<StaffMember>({
        fetcher: () => staffMembersApi.fetchById(memberId!),
        enabled: !!memberId,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [memberId],
    });

    const contracts = useQuery<MembershipContract[]>({
        fetcher: () => staffContractsApi.fetchByMember(memberId!),
        enabled: !!memberId,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [memberId],
    });

    const attendance = useQuery<StaffAttendance[]>({
        fetcher: () => staffAttendanceApi.fetchByMember(memberId!),
        enabled: !!memberId,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [memberId],
    });

    const updateMember = useMutation<StaffMember, { id: string; payload: Partial<{ membership_number: string; emergency_contact: string; health_notes: string }> }>({
        mutationFn: ({ id, payload }) => staffMembersApi.update(id, payload),
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    return {
        member,
        contracts,
        attendance,
        updateMember,
        refetchAll: () => {
            member.refetch();
            contracts.refetch();
            attendance.refetch();
        },
    };
}

