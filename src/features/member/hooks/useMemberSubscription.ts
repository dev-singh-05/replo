// ============================================================
// Replo — useMemberSubscription Hook
// Full subscription history with computed fields
// ============================================================

import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { memberSubscriptionsApi } from '../api/member.api';
import type { MemberSubscription } from '../types';
import { MEMBER_ROLE } from '../types';

export interface EnrichedSubscription extends MemberSubscription {
    daysRemaining: number | null;
    isExpiringSoon: boolean;
    isExpired: boolean;
}

function enrichSubscription(sub: MemberSubscription): EnrichedSubscription {
    const today = new Date();
    const endDate = new Date(sub.end_date);
    const daysRemaining = sub.status === 'active'
        ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

    return {
        ...sub,
        daysRemaining,
        isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0,
        isExpired: sub.status === 'expired' || (sub.status === 'active' && endDate < today),
    };
}

export function useMemberSubscription() {
    const list = useQuery<MemberSubscription[]>({
        fetcher: () => memberSubscriptionsApi.fetchMy(),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const enrichedData = (list.data ?? []).map(enrichSubscription);

    return {
        subscriptions: enrichedData,
        isLoading: list.isLoading,
        error: list.error,
        refetch: list.refetch,
    };
}
