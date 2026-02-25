// ============================================================
// Replo — Member App Types (Block 6)
// ============================================================

import type { UserProfile } from '@/src/types/database';

// ── Role Constant ────────────────────────────────────────────

export const MEMBER_ROLE = ['member'] as const;

// ── Domain Types ─────────────────────────────────────────────

/** Member's own subscription with plan details */
export interface MemberSubscription {
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
}

/** Member's own attendance record */
export interface MemberAttendance {
    id: string;
    gym_id: string;
    member_id: string;
    check_in_at: string;
    check_out_at: string | null;
    method: string;
    created_at: string;
}

/** Member's own slot booking */
export interface MemberBooking {
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
}

/** Public workout template */
export interface MemberWorkoutTemplate {
    id: string;
    gym_id: string;
    created_by: string;
    name: string;
    description: string | null;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    duration_mins: number | null;
    target_muscles: string[] | null;
    exercises: WorkoutExercise[];
    is_public: boolean;
    created_at: string;
}

/** Exercise within a workout template (JSONB schema) */
export interface WorkoutExercise {
    name: string;
    sets?: number;
    reps?: string;
    duration?: string;
    rest?: string;
    notes?: string;
}

/** Public diet template */
export interface MemberDietTemplate {
    id: string;
    gym_id: string;
    created_by: string;
    name: string;
    description: string | null;
    goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'general_health';
    calories: number | null;
    meals: DietMeal[];
    is_public: boolean;
    created_at: string;
}

/** Meal within a diet template (JSONB schema) */
export interface DietMeal {
    name: string;
    time?: string;
    items?: string[];
    calories?: number;
    protein?: string;
    carbs?: string;
    fats?: string;
    notes?: string;
}

/** Feedback record */
export interface MemberFeedback {
    id: string;
    gym_id: string;
    member_id: string;
    category: FeedbackCategory;
    rating: number;
    comment: string | null;
    is_anonymous: boolean;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    created_at: string;
    updated_at: string;
}

/** Aggregated data for member home screen */
export interface MemberHomeData {
    profile: UserProfile | null;
    activeSubscription: MemberSubscription | null;
    daysRemaining: number | null;
    isExpiringSoon: boolean;
    monthlyVisits: number;
}

// ── Input Types ──────────────────────────────────────────────

export interface CreateBookingInput {
    slot_date: string;
    start_time: string;
    end_time: string;
    activity?: string;
}

export interface CreateFeedbackInput {
    category: FeedbackCategory;
    rating: number;
    comment?: string;
    is_anonymous?: boolean;
}

// ── Filter Types ─────────────────────────────────────────────

export type FeedbackCategory = 'general' | 'facility' | 'trainer' | 'equipment' | 'cleanliness' | 'other';

export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type DietGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'general_health';

export interface AttendanceFilters {
    /** YYYY-MM format */
    month?: string;
}

export interface BookingFilters {
    /** YYYY-MM-DD format */
    date: string;
}

// ── Display Constants ────────────────────────────────────────

export const FEEDBACK_CATEGORIES: { label: string; value: FeedbackCategory }[] = [
    { label: 'General', value: 'general' },
    { label: 'Facility', value: 'facility' },
    { label: 'Trainer', value: 'trainer' },
    { label: 'Equipment', value: 'equipment' },
    { label: 'Cleanliness', value: 'cleanliness' },
    { label: 'Other', value: 'other' },
];

export const WORKOUT_DIFFICULTIES: { label: string; value: WorkoutDifficulty }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'Expert', value: 'expert' },
];

export const DIET_GOALS: { label: string; value: DietGoal }[] = [
    { label: 'Weight Loss', value: 'weight_loss' },
    { label: 'Muscle Gain', value: 'muscle_gain' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Endurance', value: 'endurance' },
    { label: 'General Health', value: 'general_health' },
];
