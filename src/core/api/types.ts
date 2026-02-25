// ============================================================
// Replo — API Error Types
// Standardized errors for the data access layer
// ============================================================

export class AppError extends Error {
    code: string;
    details?: any;
    isNetworkError: boolean;
    isPermissionError: boolean;

    constructor(
        code: string,
        message: string,
        details?: any,
        isNetworkError = false,
        isPermissionError = false
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.isNetworkError = isNetworkError;
        this.isPermissionError = isPermissionError;
    }
}

export function handleSupabaseError(error: any): never {
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        throw new AppError('UNAUTHORIZED', 'Authentication failed or expired', error, false, true);
    }

    if (error?.message === 'Failed to fetch' || error?.message?.includes('Network')) {
        throw new AppError('NETWORK_ERROR', 'Network request failed', error, true, false);
    }

    throw new AppError('DB_ERROR', error?.message || 'Database error occurred', error);
}
