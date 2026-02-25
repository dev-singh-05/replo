// ============================================================
// Replo — useDietTemplates Hook
// Public diet templates with goal filter
// ============================================================

import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useRef, useState } from 'react';
import { memberDietsApi } from '../api/member.api';
import type { DietGoal, MemberDietTemplate } from '../types';
import { MEMBER_ROLE } from '../types';

export function useDietTemplates() {
    const [goal, setGoal] = useState<DietGoal | undefined>(undefined);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const list = useQuery<MemberDietTemplate[]>({
        fetcher: () => memberDietsApi.fetchPublic(goal),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [goal],
    });

    const setGoalFilter = useCallback((value: DietGoal | undefined) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setGoal(value);
        }, 300);
    }, []);

    return {
        templates: list.data ?? [],
        isLoading: list.isLoading,
        error: list.error,
        refetch: list.refetch,
        goal,
        setGoalFilter,
    };
}
