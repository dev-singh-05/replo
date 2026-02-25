import { useAuthStore } from '@/src/store/auth-store';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { AppError } from '../api/types';

interface UseMutationOptions<TData, TVariables> {
    mutationFn: (variables: TVariables) => Promise<TData>;
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    onError?: (error: AppError, variables: TVariables) => void;
    allowedRoles?: AppRole[];
}

/**
 * Generic mutation hook for creating, updating, or deleting data.
 * Supports loading states, error handling, and role guards.
 */
export function useMutation<TData, TVariables>({
    mutationFn,
    onSuccess,
    onError,
    allowedRoles,
}: UseMutationOptions<TData, TVariables>) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const role = useAuthStore((s) => s.role);

    const mutate = useCallback(
        async (variables: TVariables) => {
            // Check permissions
            if (allowedRoles && (!role || !allowedRoles.includes(role))) {
                const authError = new AppError('UNAUTHORIZED', 'You do not have permission to perform this action.', null, false, true);
                setError(authError);
                if (onError) onError(authError, variables);
                throw authError; // allow caller to catch it if they want
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await mutationFn(variables);
                if (onSuccess) {
                    await onSuccess(result, variables);
                }
                return result;
            } catch (err: any) {
                const appError = err instanceof AppError
                    ? err
                    : new AppError('MUTATION_ERROR', err.message || 'Mutation failed');

                setError(appError);
                if (onError) {
                    onError(appError, variables);
                }
                throw appError;
            } finally {
                setIsLoading(false);
            }
        },
        [mutationFn, onSuccess, onError, allowedRoles, role]
    );

    return { mutate, isLoading, error, reset: () => setError(null) };
}
