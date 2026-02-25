import { createTenantQuery } from '@/src/core/api/queryBuilder';
import { handleSupabaseError } from '@/src/core/api/types';

export interface Attendance {
    id: string;
    gym_id: string;
    member_id: string;
    check_in_time: string;
    check_out_time: string | null;
    created_at: string;
}

/**
 * Access layer for the 'attendance' table.
 */
export const attendanceApi = {
    async fetchList({ from, to, limit }: { from: number; to: number; limit: number }) {
        const { data, error, count } = await createTenantQuery('attendance')
            .select('*, members(profiles(full_name))', { count: 'exact' })
            .order('check_in_time', { ascending: false })
            .range(from, to);

        if (error) handleSupabaseError(error);

        const rows = (data ?? []) as unknown as any[];
        return {
            data: rows,
            count,
            hasMore: rows.length === limit
        };
    },

    async checkIn(member_id: string) {
        const { data, error } = await createTenantQuery('attendance')
            .insert({ member_id, check_in_time: new Date().toISOString() })
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as Attendance;
    },

    async checkOut(id: string) {
        const { data, error } = await createTenantQuery('attendance')
            .update({ check_out_time: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as Attendance;
    }
};
