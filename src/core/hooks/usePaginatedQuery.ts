import { useAuthStore } from '@/src/store/auth-store';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getOffsetRange, type PaginatedResponse } from '../api/pagination';
import { AppError } from '../api/types';

interface UsePaginatedQueryOptions<T> {
    fetcher: (range: { from: number; to: number; limit: number }) => Promise<PaginatedResponse<T>>;
    limit?: number;
    enabled?: boolean;
    allowedRoles?: AppRole[];
    dependencies?: any[];
}

/**
 * Generic paginated query hook using offset/limit.
 * Accumulates data automatically on loadMore().
 */
export function usePaginatedQuery<T>({
    fetcher,
    limit = 20,
    enabled = true,
    allowedRoles,
    dependencies = [],
}: UsePaginatedQueryOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const role = useAuthStore((s) => s.role);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const execute = useCallback(
        async (isLoadMore = false) => {
            if (!enabled || !isHydrated) return;

            if (allowedRoles && (!role || !allowedRoles.includes(role))) {
                if (mounted.current) {
                    setError(new AppError('UNAUTHORIZED', 'You do not have permission to view this data.', null, false, true));
                }
                return;
            }

            const currentOffset = isLoadMore ? offset : 0;

            if (mounted.current) {
                if (isLoadMore) {
                    setIsFetchingMore(true);
                } else {
                    setIsLoading(true);
                }
                setError(null);
            }

            try {
                const range = getOffsetRange(currentOffset, limit);
                const result = await fetcher({ ...range, limit });

                if (mounted.current) {
                    if (isLoadMore) {
                        setData((prev) => [...prev, ...result.data]);
                    } else {
                        setData(result.data);
                    }
                    setHasMore(result.hasMore);
                    setOffset(currentOffset + limit);
                }
            } catch (err: any) {
                if (mounted.current) {
                    if (err instanceof AppError) {
                        setError(err);
                    } else {
                        setError(new AppError('FETCH_ERROR', err.message || 'Failed to fetch paginated data'));
                    }
                }
            } finally {
                if (mounted.current) {
                    setIsLoading(false);
                    setIsFetchingMore(false);
                }
            }
        },
        [enabled, isHydrated, role, offset, limit, fetcher, ...dependencies]
    );

    // Initial load or refetch when dependencies change
    useEffect(() => {
        // Reset offset to 0 when dependencies change implicitly triggering initial fetch
        setOffset(0);
        execute(false);
    }, [execute]);

    return {
        data,
        isLoading,
        isFetchingMore,
        error,
        hasMore,
        loadMore: () => {
            if (!isLoading && !isFetchingMore && hasMore) {
                execute(true);
            }
        },
        refetch: () => {
            setOffset(0);
            execute(false);
        },
    };
}
