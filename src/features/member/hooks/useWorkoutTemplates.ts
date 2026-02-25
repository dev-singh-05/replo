// ============================================================
// Replo — useWorkoutTemplates Hook
// Public workout templates with difficulty filter
// ============================================================

import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useRef, useState } from 'react';
import { memberWorkoutsApi } from '../api/member.api';
import type { MemberWorkoutTemplate, WorkoutDifficulty } from '../types';
import { MEMBER_ROLE } from '../types';

export function useWorkoutTemplates() {
    const [difficulty, setDifficulty] = useState<WorkoutDifficulty | undefined>(undefined);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const list = useQuery<MemberWorkoutTemplate[]>({
        fetcher: () => memberWorkoutsApi.fetchPublic(difficulty),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [difficulty],
    });

    const setDifficultyFilter = useCallback((value: WorkoutDifficulty | undefined) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDifficulty(value);
        }, 300);
    }, []);

    return {
        templates: list.data ?? [],
        isLoading: list.isLoading,
        error: list.error,
        refetch: list.refetch,
        difficulty,
        setDifficultyFilter,
    };
}
