// ============================================================
// Replo — useFeedback Hook
// Feedback submission + history for members
// ============================================================

import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { memberFeedbackApi } from '../api/member.api';
import type { CreateFeedbackInput, MemberFeedback } from '../types';
import { MEMBER_ROLE } from '../types';

export function useFeedback() {
    const history = useQuery<MemberFeedback[]>({
        fetcher: () => memberFeedbackApi.fetchMy(),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const submitFeedback = useMutation<MemberFeedback, CreateFeedbackInput>({
        mutationFn: memberFeedbackApi.submit,
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    return {
        feedbackHistory: history.data ?? [],
        isLoading: history.isLoading,
        error: history.error,
        refetch: history.refetch,
        submitFeedback,
    };
}
