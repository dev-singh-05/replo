// ============================================================
// Replo — useMemberHome Hook
// Aggregated member home screen data
// ============================================================

import { useQuery } from '@/src/core/hooks/useQuery';
import { useAuthStore } from '@/src/store/auth-store';
import type { AppRole } from '@/src/types/auth';
import { memberAttendanceApi, memberSubscriptionsApi } from '../api/member.api';
import type { MemberHomeData, MemberSubscription } from '../types';
import { MEMBER_ROLE } from '../types';

function computeDaysRemaining(sub: MemberSubscription | null): number | null {
    if (!sub) return null;
    const end = new Date(sub.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

export function useMemberHome() {
    const profile = useAuthStore((s) => s.profile);

    const subscription = useQuery<MemberSubscription | null>({
        fetcher: () => memberSubscriptionsApi.fetchActive(),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const monthlyVisits = useQuery<number>({
        fetcher: () => memberAttendanceApi.getMonthlyVisitCount(),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const daysRemaining = computeDaysRemaining(subscription.data ?? null);
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    const homeData: MemberHomeData = {
        profile,
        activeSubscription: subscription.data ?? null,
        daysRemaining,
        isExpiringSoon,
        monthlyVisits: monthlyVisits.data ?? 0,
    };

    return {
        homeData,
        isLoading: subscription.isLoading || monthlyVisits.isLoading,
        error: subscription.error || monthlyVisits.error,
        refetch: () => {
            subscription.refetch();
            monthlyVisits.refetch();
        },
    };
}
