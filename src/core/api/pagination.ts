// ============================================================
// Replo — Pagination Utilities
// Helpers for standardizing paginated requests
// ============================================================

export interface PaginationParams {
    limit?: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number | null;
    hasMore: boolean;
}

/**
 * Calculates the exact from/to range for Supabase range queries.
 */
export function getPaginationRange(page: number, size: number) {
    const limit = size ? size : 10;
    const from = page ? page * limit : 0;
    const to = page ? from + size - 1 : size - 1;

    return { from, to, limit };
}

/**
 * Calculates range based on offset directly.
 */
export function getOffsetRange(offset: number, limit: number) {
    return {
        from: offset,
        to: offset + limit - 1
    };
}
