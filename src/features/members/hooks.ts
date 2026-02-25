import { useMutation } from '@/src/core/hooks/useMutation';
import { usePaginatedQuery } from '@/src/core/hooks/usePaginatedQuery';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { Member } from '@/src/types/database';
import { membersApi } from './api';

// ------------------------------------------------------------------
// Reusable React Hooks for the Members feature
// UI strictly consumes these hooks instead of raw supabase calls.
// ------------------------------------------------------------------

export function useMembersList(limit = 20) {
    // Members list accessible to owner, manager, trainer, receptionist
    return usePaginatedQuery({
        fetcher: membersApi.fetchList,
        limit,
        allowedRoles: ['owner', 'manager', 'trainer', 'receptionist']
    });
}

export function useMemberDetail(id: string) {
    return useQuery({
        fetcher: () => membersApi.fetchById(id),
        enabled: !!id,
        dependencies: [id],
        allowedRoles: ['owner', 'manager', 'trainer', 'receptionist']
    });
}

export function useCreateMember() {
    return useMutation({
        mutationFn: (payload: Partial<Member>) => membersApi.create(payload),
        allowedRoles: ['owner', 'manager'] // Restrict creation
    });
}

export function useUpdateMember() {
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Member> }) =>
            membersApi.update(id, payload),
        allowedRoles: ['owner', 'manager', 'receptionist'] // Restrict modification
    });
}

export function useDeleteMember() {
    return useMutation({
        mutationFn: (id: string) => membersApi.remove(id),
        allowedRoles: ['owner'] // Only owners can delete
    });
}
