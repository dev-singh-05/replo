// ============================================================
// Replo — Staff API Layer
// All queries are tenant-bound via createTenantQuery.
// gym_id is NEVER accepted from the client.
// ============================================================

import { createTenantQuery, getTenantId } from '@/src/core/api/queryBuilder';
import { handleSupabaseError } from '@/src/core/api/types';
import { supabase } from '@/src/core/supabase/client';
import type {
    BookingFilters,
    CreateBookingInput,
    CreateMemberInput,
    CreateSubscriptionInput,
    MemberFilters,
    ReportFilters,
    StaffAttendance,
    StaffBooking,
    StaffEquipmentReport,
    StaffMember,
    StaffSubscription,
} from '../types';

// ── Members ──────────────────────────────────────────────────

export const staffMembersApi = {
    async fetchList({
        from,
        to,
        limit,
        filters,
    }: {
        from: number;
        to: number;
        limit: number;
        filters?: MemberFilters;
    }) {
        let query = createTenantQuery('members')
            .select('*, users(*)', { count: 'exact' });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.search) {
            // Search by membership_number or join to users.full_name
            query = query.or(
                `membership_number.ilike.%${filters.search}%,users.full_name.ilike.%${filters.search}%`
            );
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) handleSupabaseError(error);

        return {
            data: (data ?? []) as unknown as StaffMember[],
            count,
            hasMore: (data ?? []).length === limit,
        };
    },

    async fetchById(id: string) {
        const { data, error } = await createTenantQuery('members')
            .select('*, users(*)')
            .eq('id', id)
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffMember;
    },

    async create(input: CreateMemberInput) {
        const { data, error } = await createTenantQuery('members')
            .insert({
                user_id: input.user_id,
                membership_number: input.membership_number || null,
                emergency_contact: input.emergency_contact || null,
                health_notes: input.health_notes || null,
                status: 'active',
            })
            .select('*, users(*)')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffMember;
    },

    async update(id: string, payload: Partial<{ membership_number: string; emergency_contact: string; health_notes: string }>) {
        const { data, error } = await createTenantQuery('members')
            .update(payload)
            .eq('id', id)
            .select('*, users(*)')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffMember;
    },

    async suspend(id: string) {
        const { data, error } = await createTenantQuery('members')
            .update({ status: 'suspended' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffMember;
    },

    async reactivate(id: string) {
        const { data, error } = await createTenantQuery('members')
            .update({ status: 'active' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffMember;
    },
};

// ── Subscriptions ────────────────────────────────────────────

export const staffSubscriptionsApi = {
    async fetchByMember(memberId: string) {
        const { data, error } = await createTenantQuery('subscriptions')
            .select('*, plans(id, name, duration_days, price)')
            .eq('member_id', memberId)
            .order('start_date', { ascending: false })
            .limit(20);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as StaffSubscription[];
    },

    async create(input: CreateSubscriptionInput) {
        const gymId = getTenantId();

        // Business rule: check for overlapping active subscription
        const { data: existing, error: checkErr } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('gym_id', gymId)
            .eq('member_id', input.member_id)
            .eq('status', 'active')
            .gte('end_date', input.start_date)
            .lte('start_date', input.end_date)
            .limit(1);

        if (checkErr) handleSupabaseError(checkErr);
        if (existing && existing.length > 0) {
            throw new Error('Member already has an active subscription in this date range.');
        }

        const { data, error } = await createTenantQuery('subscriptions')
            .insert({
                member_id: input.member_id,
                plan_id: input.plan_id,
                start_date: input.start_date,
                end_date: input.end_date,
                amount_paid: input.amount_paid,
                payment_method: input.payment_method || null,
                status: 'active',
            })
            .select('*, plans(id, name, duration_days, price)')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffSubscription;
    },

    async cancel(id: string) {
        const { data, error } = await createTenantQuery('subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffSubscription;
    },

    async pause(id: string) {
        const { data, error } = await createTenantQuery('subscriptions')
            .update({ status: 'paused' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffSubscription;
    },
};

// ── Plans (read-only for staff) ──────────────────────────────

export const staffPlansApi = {
    async fetchActive() {
        const { data, error } = await createTenantQuery('plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as Array<{
            id: string; name: string; duration_days: number; price: number; currency: string;
        }>;
    },
};

// ── Attendance ───────────────────────────────────────────────

export const staffAttendanceApi = {
    async fetchActiveCheckins() {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await createTenantQuery('attendance')
            .select('*, members(id, membership_number, status, users(*))')
            .is('check_out_at', null)
            .gte('check_in_at', today)
            .order('check_in_at', { ascending: false })
            .limit(100);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as StaffAttendance[];
    },

    async fetchByMember(memberId: string) {
        const { data, error } = await createTenantQuery('attendance')
            .select('*')
            .eq('member_id', memberId)
            .order('check_in_at', { ascending: false })
            .limit(30);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as StaffAttendance[];
    },

    async checkIn(memberId: string) {
        const gymId = getTenantId();
        const today = new Date().toISOString().split('T')[0];

        // Business rule 1: verify member is active
        const { data: member, error: memberErr } = await supabase
            .from('members')
            .select('id, status')
            .eq('gym_id', gymId)
            .eq('id', memberId)
            .single();

        if (memberErr) handleSupabaseError(memberErr);
        if (!member || member.status !== 'active') {
            throw new Error('Cannot check-in: member is not active.');
        }

        // Business rule 2: prevent duplicate (unclosed check-in today)
        const { data: existing, error: dupErr } = await supabase
            .from('attendance')
            .select('id')
            .eq('gym_id', gymId)
            .eq('member_id', memberId)
            .is('check_out_at', null)
            .gte('check_in_at', today)
            .limit(1);

        if (dupErr) handleSupabaseError(dupErr);
        if (existing && existing.length > 0) {
            throw new Error('Member is already checked in.');
        }

        const { data, error } = await createTenantQuery('attendance')
            .insert({
                member_id: memberId,
                check_in_at: new Date().toISOString(),
                method: 'manual',
            })
            .select('*, members(id, membership_number, status, users(*))')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffAttendance;
    },

    async checkOut(attendanceId: string) {
        const { data, error } = await createTenantQuery('attendance')
            .update({ check_out_at: new Date().toISOString() })
            .eq('id', attendanceId)
            .select('*, members(id, membership_number, status, users(*))')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffAttendance;
    },

    async searchMembers(search: string) {
        const { data, error } = await createTenantQuery('members')
            .select('*, users(*)')
            .eq('status', 'active')
            .or(`membership_number.ilike.%${search}%,users.full_name.ilike.%${search}%`)
            .limit(10);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as StaffMember[];
    },
};

// ── Bookings ─────────────────────────────────────────────────

export const staffBookingsApi = {
    async fetchByDate(filters: BookingFilters) {
        let query = createTenantQuery('slot_bookings')
            .select('*, members(id, membership_number, users(*))')
            .eq('slot_date', filters.date)
            .order('start_time', { ascending: true });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query.limit(50);

        if (error) handleSupabaseError(error);
        return (data ?? []) as unknown as StaffBooking[];
    },

    async create(input: CreateBookingInput) {
        // Business rule: validate slot_date >= today
        const today = new Date().toISOString().split('T')[0];
        if (input.slot_date < today) {
            throw new Error('Cannot create booking in the past.');
        }
        if (input.start_time >= input.end_time) {
            throw new Error('Start time must be before end time.');
        }

        const { data, error } = await createTenantQuery('slot_bookings')
            .insert({
                member_id: input.member_id,
                slot_date: input.slot_date,
                start_time: input.start_time,
                end_time: input.end_time,
                activity: input.activity || null,
                status: 'booked',
            })
            .select('*, members(id, membership_number, users(*))')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffBooking;
    },

    async approve(id: string) {
        const { data, error } = await createTenantQuery('slot_bookings')
            .update({ status: 'checked_in' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffBooking;
    },

    async cancel(id: string) {
        const { data, error } = await createTenantQuery('slot_bookings')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffBooking;
    },

    async markNoShow(id: string) {
        const { data, error } = await createTenantQuery('slot_bookings')
            .update({ status: 'no_show' })
            .eq('id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffBooking;
    },
};

// ── Equipment Reports ────────────────────────────────────────

export const staffEquipmentReportsApi = {
    async fetchList({
        from,
        to,
        limit,
        filters,
    }: {
        from: number;
        to: number;
        limit: number;
        filters?: ReportFilters;
    }) {
        let query = createTenantQuery('equipment_reports')
            .select('*, equipment(id, name, category, status)', { count: 'exact' });

        if (filters?.severity) {
            query = query.eq('severity', filters.severity);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) handleSupabaseError(error);

        return {
            data: (data ?? []) as unknown as StaffEquipmentReport[],
            count,
            hasMore: (data ?? []).length === limit,
        };
    },

    async markInProgress(id: string) {
        const { data, error } = await createTenantQuery('equipment_reports')
            .update({ status: 'in_progress' })
            .eq('id', id)
            .select('*, equipment(id, name, category, status)')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffEquipmentReport;
    },

    async markResolved(id: string) {
        const { data, error } = await createTenantQuery('equipment_reports')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, equipment(id, name, category, status)')
            .single();

        if (error) handleSupabaseError(error);
        return data as unknown as StaffEquipmentReport;
    },
};
