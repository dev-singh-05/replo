import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { staffPlansApi, staffSubscriptionsApi } from '../api/staff.api';
import type { CreateSubscriptionInput, StaffSubscription } from '../types';
import { MUTATION_ROLES, STAFF_ROLES } from '../types';

/**
 * Subscription management for a specific member.
 */
export function useSubscriptions(memberId: string | null) {
    const list = useQuery<StaffSubscription[]>({
        fetcher: () => staffSubscriptionsApi.fetchByMember(memberId!),
        enabled: !!memberId,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [memberId],
    });

    const plans = useQuery<Array<{ id: string; name: string; duration_days: number; price: number; currency: string }>>({
        fetcher: staffPlansApi.fetchActive,
        allowedRoles: [...STAFF_ROLES] as AppRole[],
    });

    const createSubscription = useMutation<StaffSubscription, CreateSubscriptionInput>({
        mutationFn: staffSubscriptionsApi.create,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const cancelSubscription = useMutation<StaffSubscription, string>({
        mutationFn: staffSubscriptionsApi.cancel,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const pauseSubscription = useMutation<StaffSubscription, string>({
        mutationFn: staffSubscriptionsApi.pause,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    return {
        subscriptions: list,
        plans,
        createSubscription,
        cancelSubscription,
        pauseSubscription,
    };
}
