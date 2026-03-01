// ============================================================
// Replo — Staff Operations Types
// ============================================================

import type { Member, UserProfile } from '@/src/types/database';

// ── Domain Types ─────────────────────────────────────────────

/** Member with joined user profile */
export type StaffMember = Member & {
    users: UserProfile | null;
};

export interface StaffSubscription {
    id: string;
    gym_id: string;
    member_id: string;
    plan_id: string;
    start_date: string;
    end_date: string;
    amount_paid: number;
    payment_method: string | null;
    status: 'active' | 'expired' | 'cancelled' | 'paused';
    created_at: string;
    updated_at: string;
    plans?: { id: string; name: string; duration_days: number; price: number } | null;
    members?: { id: string; membership_number: string | null; users: UserProfile | null } | null;
}

export interface MembershipContract {
    id: string;
    member_id: string;
    start_date: string;
    end_date: string;
    plan_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    status: 'active' | 'paused' | 'expired';
    pause_start_date: string | null;
    pause_end_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface StaffAttendance {
    id: string;
    gym_id: string;
    member_id: string;
    check_in_at: string;
    check_out_at: string | null;
    method: string;
    created_at: string;
    members?: { id: string; membership_number: string | null; status: string; users: UserProfile | null } | null;
}

export interface StaffBooking {
    id: string;
    gym_id: string;
    member_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    activity: string | null;
    status: 'booked' | 'checked_in' | 'cancelled' | 'no_show';
    created_at: string;
    updated_at: string;
    members?: { id: string; membership_number: string | null; users: UserProfile | null } | null;
}

export interface StaffEquipmentReport {
    id: string;
    gym_id: string;
    equipment_id: string;
    reported_by: string;
    title: string;
    description: string | null;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    equipment?: { id: string; name: string; category: string; status: string } | null;
}

// ── Input Types ──────────────────────────────────────────────

export interface CreateMemberInput {
    phone: string;
    name: string;
    membership_number?: string;
    joined_at?: string;
    start_date?: string;
    end_date?: string;
    plan_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    initial_payment_status: 'paid' | 'unpaid';
}

export interface CreateMemberResult {
    status: 'created' | 'conflict_same_gym' | 'conflict_other_gym' | 'error';
    message: string;
    member?: StaffMember;
    existingMemberId?: string;
    targetUserId?: string;
    targetUserName?: string;
    hasPendingRequest?: boolean;
}

export interface CreateSubscriptionInput {
    member_id: string;
    plan_id: string;
    start_date: string;
    end_date: string;
    amount_paid: number;
    payment_method?: string;
}

export interface CreateBookingInput {
    member_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    activity?: string;
}

// ── Filter Types ─────────────────────────────────────────────

export interface MemberFilters {
    search?: string;
    status?: string;
}

export interface BookingFilters {
    date: string;         // YYYY-MM-DD
    status?: string;
}

export interface ReportFilters {
    severity?: string;
    status?: string;
}

// ── Staff Roles ──────────────────────────────────────────────

export const STAFF_ROLES = ['owner', 'manager', 'trainer', 'receptionist'] as const;
export const MUTATION_ROLES = ['owner', 'manager', 'receptionist'] as const;
