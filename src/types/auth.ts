// ============================================================
// Replo — Auth & Role Types
// ============================================================

import type { Session, User } from '@supabase/supabase-js';
import type { Gym, UserProfile } from './database';

/** All possible resolved roles in the system */
export type AppRole =
    | 'owner'
    | 'manager'
    | 'trainer'
    | 'receptionist'
    | 'member';

/** Auth store state shape */
export interface AuthState {
    /** Supabase auth session (JWT + refresh token) */
    session: Session | null;
    /** Supabase auth.users record */
    user: User | null;
    /** public.users profile */
    profile: UserProfile | null;
    /** Resolved gym tenant */
    gym: Gym | null;
    /** Resolved user role within the gym */
    role: AppRole | null;
    /** Pre-login gym selection (before sign-in) */
    selectedGymId: string | null;
    /** Whether the initial hydration has completed */
    isHydrated: boolean;
    /** Whether an async action is in progress */
    isLoading: boolean;
    /** Last error message */
    error: string | null;
}

/** Auth store actions */
export interface AuthActions {
    /** Boot-time session restore + tenant resolution */
    initialize: () => Promise<void>;
    /** Email/password sign in */
    signIn: (email: string, password: string) => Promise<void>;
    /** Email/password sign up + profile creation */
    signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
    /** Sign out and clear all state */
    signOut: () => Promise<void>;
    /** Create a new gym (current user becomes owner) */
    createGym: (data: CreateGymInput) => Promise<void>;
    /** Re-fetch profile and re-resolve tenant */
    refreshProfile: () => Promise<void>;
    /** Update profile fields (name, phone, role) during onboarding */
    updateProfileDetails: (data: Partial<UserProfile>) => Promise<void>;
    /** Mark step completed */
    completeOnboardingStep: (step: 'first_login' | 'profile') => Promise<void>;
    /** Resolve gym + role from the database */
    resolveTenant: (userId: string) => Promise<void>;
    /** Set pre-login gym selection */
    setSelectedGymId: (gymId: string | null) => void;
    /** Reset store to initial state */
    clear: () => void;
}

/** Input for gym creation */
export interface CreateGymInput {
    name: string;
    slug: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
}
