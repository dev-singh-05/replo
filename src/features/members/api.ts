import { createTenantQuery } from '@/src/core/api/queryBuilder';
import { handleSupabaseError } from '@/src/core/api/types';
import type { Member, UserProfile } from '@/src/types/database';

export type MemberWithProfile = Member & { profiles: UserProfile | null };

/**
 * Access layer for the 'members' table.
 * All queries are strictly tenant-bound via createTenantQuery.
 */
export const membersApi = {
    async fetchList({ from, to, limit }: { from: number; to: number; limit: number }) {
        const { data, error, count } = await createTenantQuery('members')
            .select('*, profiles(*)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) handleSupabaseError(error);

        const rows = (data ?? []) as unknown as MemberWithProfile[];
        return {
            data: rows,
            count,
            hasMore: rows.length === limit
        };
    },

    async fetchById(id: string) {
        const { data, error } = await createTenantQuery('members')
            .select('*, profiles(*)')
            .eq('id', id)
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as MemberWithProfile;
    },

    async create(payload: Partial<Member>) {
        const { data, error } = await createTenantQuery('members')
            .insert(payload)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as Member;
    },

    async update(id: string, payload: Partial<Member>) {
        const { data, error } = await createTenantQuery('members')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as Member;
    },

    async remove(id: string) {
        const { error } = await createTenantQuery('members')
            .delete()
            .eq('id', id);

        if (error) handleSupabaseError(error);
        return true;
    }
};
