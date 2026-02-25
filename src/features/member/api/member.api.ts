// ============================================================
// Replo — Member API Layer (Block 6)
// All queries are tenant-bound via createTenantQuery.
// Member ID is resolved server-side — never accepted from client.
// ============================================================

import { createTenantQuery, getTenantId } from '@/src/core/api/queryBuilder';
import { handleSupabaseError } from '@/src/core/api/types';
import { supabase } from '@/src/core/supabase/client';
import { useAuthStore } from '@/src/store/auth-store';
import type {
    AttendanceFilters,
    CreateBookingInput,
    CreateFeedbackInput,
    DietGoal,
    MemberAttendance,
    MemberBooking,
    MemberDietTemplate,
    MemberFeedback,
    MemberSubscription,
    MemberWorkoutTemplate,
    WorkoutDifficulty,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Resolves the current authenticated user's member record ID.
 * This is the ONLY way member_id is obtained — never from client input.
 */
async function getMyMemberId(): Promise<string> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const gymId = getTenantId();

    const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('gym_id', gymId)
        .eq('user_id', userId)
        .single();

    if (error) handleSupabaseError(error);
    if (!data) throw new Error('Member record not found');

    return data.id;
}

// ── Subscriptions ────────────────────────────────────────────

export const memberSubscriptionsApi = {
    async fetchMy() {
        const memberId = await getMyMemberId();

        const { data, error } = await createTenantQuery('subscriptions')
            .select('*, plans(id, name, duration_days, price)')
            .eq('member_id', memberId)
            .order('start_date', { ascending: false })
            .limit(20);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as MemberSubscription[];
    },

    async fetchActive() {
        const memberId = await getMyMemberId();
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await createTenantQuery('subscriptions')
            .select('*, plans(id, name, duration_days, price)')
            .eq('member_id', memberId)
            .eq('status', 'active')
            .gte('end_date', today)
            .order('end_date', { ascending: true })
            .limit(1);

        if (error) handleSupabaseError(error);
        return (data && data.length > 0) ? (data[0] as unknown as MemberSubscription) : null;
    },
};

// ── Attendance ───────────────────────────────────────────────

export const memberAttendanceApi = {
    async fetchHistory({
        from,
        to,
        limit,
        filters,
    }: {
        from: number;
        to: number;
        limit: number;
        filters?: AttendanceFilters;
    }) {
        const memberId = await getMyMemberId();

        let query = createTenantQuery('attendance')
            .select('*', { count: 'exact' })
            .eq('member_id', memberId);

        // Month filter: YYYY-MM
        if (filters?.month) {
            const startOfMonth = `${filters.month}-01`;
            const [year, month] = filters.month.split('-').map(Number);
            const lastDay = new Date(year, month, 0).getDate();
            const endOfMonth = `${filters.month}-${String(lastDay).padStart(2, '0')}`;

            query = query
                .gte('check_in_at', `${startOfMonth}T00:00:00`)
                .lte('check_in_at', `${endOfMonth}T23:59:59`);
        }

        const { data, error, count } = await query
            .order('check_in_at', { ascending: false })
            .range(from, to);

        if (error) handleSupabaseError(error);

        return {
            data: (data ?? []) as unknown as MemberAttendance[],
            count,
            hasMore: (data ?? []).length === limit,
        };
    },

    async getMonthlyVisitCount(month?: string) {
        const memberId = await getMyMemberId();

        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const startOfMonth = `${targetMonth}-01`;
        const [year, m] = targetMonth.split('-').map(Number);
        const lastDay = new Date(year, m, 0).getDate();
        const endOfMonth = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;

        const { count, error } = await createTenantQuery('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', memberId)
            .gte('check_in_at', `${startOfMonth}T00:00:00`)
            .lte('check_in_at', `${endOfMonth}T23:59:59`);

        if (error) handleSupabaseError(error);

        return count ?? 0;
    },
};

// ── Bookings ─────────────────────────────────────────────────

export const memberBookingsApi = {
    async fetchMyBookings(date?: string) {
        const memberId = await getMyMemberId();

        let query = createTenantQuery('slot_bookings')
            .select('*')
            .eq('member_id', memberId);

        if (date) {
            query = query.eq('slot_date', date);
        }

        const { data, error } = await query
            .order('slot_date', { ascending: false })
            .order('start_time', { ascending: true })
            .limit(50);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as MemberBooking[];
    },

    async fetchAvailableSlots(date: string) {
        // Fetch all non-cancelled bookings for this date so UI can show availability
        const { data, error } = await createTenantQuery('slot_bookings')
            .select('start_time, end_time, status')
            .eq('slot_date', date)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true });

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as Array<{ start_time: string; end_time: string; status: string }>;
    },

    async createBooking(input: CreateBookingInput) {
        const memberId = await getMyMemberId();
        const gymId = getTenantId();
        const today = new Date().toISOString().split('T')[0];

        // Business rule: cannot book past dates
        if (input.slot_date < today) {
            throw new Error('Cannot book a slot in the past.');
        }

        // Business rule: start must be before end
        if (input.start_time >= input.end_time) {
            throw new Error('Start time must be before end time.');
        }

        // Business rule: membership must be active
        const { data: member, error: memberErr } = await supabase
            .from('members')
            .select('id, status')
            .eq('gym_id', gymId)
            .eq('id', memberId)
            .single();

        if (memberErr) handleSupabaseError(memberErr);
        if (!member || member.status !== 'active') {
            throw new Error('Cannot book: your membership is not active.');
        }

        // Business rule: must have active subscription
        const { data: activeSub, error: subErr } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('gym_id', gymId)
            .eq('member_id', memberId)
            .eq('status', 'active')
            .gte('end_date', today)
            .limit(1);

        if (subErr) handleSupabaseError(subErr);
        if (!activeSub || activeSub.length === 0) {
            throw new Error('Cannot book: no active subscription found.');
        }

        const { data, error } = await createTenantQuery('slot_bookings')
            .insert({
                member_id: memberId,
                slot_date: input.slot_date,
                start_time: input.start_time,
                end_time: input.end_time,
                activity: input.activity || null,
                status: 'booked',
            })
            .select('*')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as MemberBooking;
    },

    async cancelBooking(bookingId: string) {
        const memberId = await getMyMemberId();
        const today = new Date().toISOString().split('T')[0];

        // Business rule: can only cancel own future bookings
        const { data: bookingRaw, error: fetchErr } = await createTenantQuery('slot_bookings')
            .select('id, member_id, slot_date, status')
            .eq('id', bookingId)
            .eq('member_id', memberId)
            .single();

        if (fetchErr) handleSupabaseError(fetchErr);
        if (!bookingRaw) throw new Error('Booking not found.');
        const booking = bookingRaw as unknown as { id: string; member_id: string; slot_date: string; status: string };
        if (booking.slot_date < today) throw new Error('Cannot cancel past bookings.');
        if (booking.status === 'cancelled') throw new Error('Booking is already cancelled.');

        const { data, error } = await createTenantQuery('slot_bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)
            .eq('member_id', memberId)
            .select('*')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as MemberBooking;
    },
};

// ── Workout Templates ────────────────────────────────────────

export const memberWorkoutsApi = {
    async fetchPublic(difficulty?: WorkoutDifficulty) {
        let query = createTenantQuery('workout_templates')
            .select('*')
            .eq('is_public', true);

        if (difficulty) {
            query = query.eq('difficulty', difficulty);
        }

        const { data, error } = await query
            .order('name', { ascending: true })
            .limit(50);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as MemberWorkoutTemplate[];
    },
};

// ── Diet Templates ───────────────────────────────────────────

export const memberDietsApi = {
    async fetchPublic(goal?: DietGoal) {
        let query = createTenantQuery('diet_templates')
            .select('*')
            .eq('is_public', true);

        if (goal) {
            query = query.eq('goal', goal);
        }

        const { data, error } = await query
            .order('name', { ascending: true })
            .limit(50);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as MemberDietTemplate[];
    },
};

// ── Feedback ─────────────────────────────────────────────────

export const memberFeedbackApi = {
    async submit(input: CreateFeedbackInput) {
        const memberId = await getMyMemberId();

        const { data, error } = await createTenantQuery('feedback')
            .insert({
                member_id: memberId,
                category: input.category,
                rating: input.rating,
                comment: input.comment || null,
                is_anonymous: input.is_anonymous ?? false,
                status: 'pending',
            })
            .select('*')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as MemberFeedback;
    },

    async fetchMy() {
        const memberId = await getMyMemberId();

        const { data, error } = await createTenantQuery('feedback')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as MemberFeedback[];
    },
};
