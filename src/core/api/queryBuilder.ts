// ============================================================
// Replo — Query Builder
// Centralized, tenant-aware query utility
// ============================================================

import { supabase } from '@/src/core/supabase/client';
import { useAuthStore } from '@/src/store/auth-store';
import { AppError } from './types';

/**
 * Safely fetches the current tenant ID.
 * Throws an AppError if the user is not associated with a gym.
 */
export function getTenantId(): string {
    const gym = useAuthStore.getState().gym;
    if (!gym) {
        throw new AppError(
            'MISSING_TENANT',
            'Tenant context missing',
            'User is not associated with a gym',
            false,
            true
        );
    }
    return gym.id;
}

/**
 * Create a tenant-aware query builder for a specific table.
 * Automatically injects the gym_id filter for reads/updates/deletes,
 * and attaches the gym_id to payloads for inserts.
 */
export function createTenantQuery(tableName: string) {
    return {
        get gymId() {
            return getTenantId();
        },

        select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
            return supabase.from(tableName).select(columns, options).eq('gym_id', getTenantId());
        },

        insert(values: any | any[]) {
            const gym_id = getTenantId();

            // Inject gym_id into payload
            const payload = Array.isArray(values)
                ? values.map(v => ({ ...v, gym_id }))
                : { ...values, gym_id };

            return supabase.from(tableName).insert(payload);
        },

        update(values: any) {
            const payload = { ...values };
            // Prevent overriding the gym_id
            if ('gym_id' in payload) {
                delete payload.gym_id;
            }
            return supabase.from(tableName).update(payload).eq('gym_id', getTenantId());
        },

        delete() {
            return supabase.from(tableName).delete().eq('gym_id', getTenantId());
        },

        // Fallback if raw access is absolutely needed, but strongly discouraged
        raw() {
            return supabase.from(tableName);
        }
    };
}
