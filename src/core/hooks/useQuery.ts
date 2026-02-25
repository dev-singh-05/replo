import { useAuthStore } from '@/src/store/auth-store';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError } from '../api/types';

export interface UseQueryOptions<T> {
    fetcher: () => Promise<T>;
    enabled?: boolean;
    allowedRoles?: AppRole[];
    dependencies?: any[];
}

/**
 * Generic query hook to fetch and cache data.
 * Manages loading, error states, and optional role-based guards.
 */
export function useQuery<T>({
    fetcher,
    enabled = true,
    allowedRoles,
    dependencies = [],
}: UseQueryOptions<T>) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    const role = useAuthStore((s) => s.role);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    // Track if component is mounted to prevent state updates on unmounted components
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const execute = useCallback(async () => {
        if (!enabled || !isHydrated) return;

        // Check permissions
        if (allowedRoles && (!role || !allowedRoles.includes(role))) {
            if (mounted.current) {
                setError(new AppError('UNAUTHORIZED', 'You do not have permission to view this data.', null, false, true));
            }
            return;
        }

        if (mounted.current) {
            setIsLoading(true);
            setError(null);
        }

        try {
            const result = await fetcher();
            if (mounted.current) {
                setData(result);
            }
        } catch (err: any) {
            if (mounted.current) {
                if (err instanceof AppError) {
                    setError(err);
                } else {
                    setError(new AppError('FETCH_ERROR', err.message || 'Failed to fetch data'));
                }
            }
        } finally {
            if (mounted.current) {
                setIsLoading(false);
            }
        }
    }, [enabled, isHydrated, role, ...dependencies]);

    useEffect(() => {
        execute();
    }, [execute]);

    return { data, isLoading, error, refetch: execute };
}
