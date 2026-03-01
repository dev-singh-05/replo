// ============================================================
// Replo — Auth Store (Zustand)
// Enterprise-grade session, tenant, and role resolution
// ============================================================

import { supabase } from '@/src/core/supabase/client';
import type { AppRole, AuthActions, AuthState, CreateGymInput } from '@/src/types/auth';
import type { Gym, GymStaff, Member, UserProfile } from '@/src/types/database';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

// ── Initial State ────────────────────────────────────────────

const initialState: AuthState = {
    session: null,
    user: null,
    profile: null,
    gym: null,
    role: null,
    selectedGymId: null,
    isHydrated: false,
    isLoading: false,
    error: null,
};

// ── Store ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => {
    /** Prevents concurrent hydration calls */
    let _hydrationLock = false;

    /** Subscription cleanup handle */
    let _authListenerCleanup: (() => void) | null = null;

    /**
     * Ensure a profile row exists for the given user.
     * Uses upsert so it's safe to call multiple times.
     */
    async function _ensureProfile(userId: string, fullName: string, phone?: string) {
        const { error: upsertError } = await supabase
            .from('users')
            .upsert(
                { id: userId, full_name: fullName, phone: phone || null },
                { onConflict: 'id' }
            );

        if (upsertError) {
            console.warn('[auth-store] _ensureProfile upsert failed:', upsertError);
        }

        // Fetch the profile back
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (profile) {
            set({ profile: profile as UserProfile });
        }
    }

    return {
        ...initialState,

        // ── Initialize (boot-time) ────────────────────────────────

        initialize: async () => {
            if (_hydrationLock) return;
            _hydrationLock = true;

            set({ isLoading: true, error: null });

            try {
                // 1. Restore session from storage
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (!session) {
                    set({ isHydrated: true, isLoading: false });
                    _hydrationLock = false;
                    return;
                }

                // 2. Session exists — set it and fetch profile
                set({ session, user: session.user });

                await get().refreshProfile();

                // 3. Set up auth state listener for token refresh / sign-out
                _authListenerCleanup?.();
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event: AuthChangeEvent, newSession: Session | null) => {
                        set({ session: newSession, user: newSession?.user ?? null });

                        if (event === 'SIGNED_OUT') {
                            get().clear();
                        }

                        if (event === 'TOKEN_REFRESHED' && newSession) {
                            // Re-resolve in case role/gym changed server-side
                            await get().resolveTenant(newSession.user.id);
                        }
                    }
                );
                _authListenerCleanup = () => subscription.unsubscribe();

                set({ isHydrated: true, isLoading: false });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Initialization failed';
                set({ error: message, isHydrated: true, isLoading: false });
            } finally {
                _hydrationLock = false;
            }
        },

        // ── Sign In ───────────────────────────────────────────────

        signIn: async (email: string, password: string) => {
            set({ isLoading: true, error: null });

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                set({ session: data.session, user: data.user });

                // Fetch profile + resolve tenant
                await get().refreshProfile();
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Sign in failed';
                set({ error: message, isLoading: false });
                throw err;
            }
        },

        // ── Sign Up ───────────────────────────────────────────────

        signUp: async (email: string, password: string, fullName: string, phone?: string) => {
            set({ isLoading: true, error: null });

            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName, phone: phone || null }, // Store in user metadata as backup
                    },
                });

                if (error) throw error;
                if (!data.user) throw new Error('Sign up succeeded but no user returned');

                // If email confirmation is required, session will be null.
                // Don't try to insert profile — RLS needs auth.uid() which requires a session.
                if (!data.session) {
                    set({
                        user: data.user,
                        isLoading: false,
                        error: null,
                    });
                    return;
                }

                // Session exists (no email confirmation) — create profile immediately
                set({ session: data.session, user: data.user });

                await _ensureProfile(data.user.id, fullName, phone);

                set({ isLoading: false });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Sign up failed';
                set({ error: message, isLoading: false });
                throw err;
            }
        },

        // ── Sign Out ──────────────────────────────────────────────

        signOut: async () => {
            set({ isLoading: true, error: null });

            try {
                _authListenerCleanup?.();
                _authListenerCleanup = null;

                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                get().clear();
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Sign out failed';
                set({ error: message, isLoading: false });
            }
        },

        // ── Create Gym ────────────────────────────────────────────

        createGym: async (input: CreateGymInput) => {
            const { user } = get();
            if (!user) throw new Error('Cannot create gym: not authenticated');

            set({ isLoading: true, error: null });

            try {
                // Strip undefined values to avoid Postgres issues
                const payload: Record<string, any> = {
                    name: input.name,
                    slug: input.slug,
                    owner_id: user.id,
                };
                if (input.address) payload.address = input.address;
                if (input.city) payload.city = input.city;
                if (input.state) payload.state = input.state;
                if (input.country) payload.country = input.country;
                if (input.phone) payload.phone = input.phone;
                if (input.email) payload.email = input.email;

                const { data: gym, error } = await supabase
                    .from('gyms')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;

                // Sync onboarding field per requirements
                const { data: updatedProfile } = await supabase
                    .from('users')
                    .update({ gym_id: gym.id })
                    .eq('id', user.id)
                    .select()
                    .single();

                set({
                    gym: gym as Gym,
                    role: 'owner' as AppRole,
                    profile: updatedProfile as UserProfile || get().profile,
                    isLoading: false,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Gym creation failed';
                set({ error: message, isLoading: false });
                throw err;
            }
        },

        // ── Refresh Profile ───────────────────────────────────────

        refreshProfile: async () => {
            const { user } = get();
            if (!user) return;

            try {
                // Use maybeSingle() — profile may not exist yet (new sign-up)
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error) throw error;

                if (profile) {
                    set({ profile: profile as UserProfile });
                } else {
                    // Profile doesn't exist yet — create it now
                    // (happens when user signed up with email confirmation)
                    const fullName =
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'User';
                    await _ensureProfile(user.id, fullName);
                }

                // Re-resolve tenant
                await get().resolveTenant(user.id);
            } catch (err) {
                // Don't set global error for profile refresh failures —
                // this runs in the background and shouldn't block the UI.
                console.warn('[auth-store] refreshProfile failed:', err);
            }
        },

        // ── Onboarding Mutations ──────────────────────────────────
        updateProfileDetails: async (data: Partial<UserProfile>) => {
            const { user, profile } = get();
            if (!user || !profile) return;
            set({ isLoading: true, error: null });
            try {
                const { data: updated, error } = await supabase
                    .from('users')
                    .update(data)
                    .eq('id', user.id)
                    .select()
                    .single();
                if (error) throw error;
                set({ profile: updated as UserProfile, isLoading: false });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Profile update failed';
                set({ error: message, isLoading: false });
                throw err;
            }
        },

        completeOnboardingStep: async (step: 'first_login' | 'profile') => {
            const { user, profile } = get();
            if (!user || !profile) return;

            const field = step === 'first_login' ? 'first_login_completed' : 'profile_completed';
            set({ isLoading: true, error: null });
            try {
                const { data: updated, error } = await supabase
                    .from('users')
                    .update({ [field]: true })
                    .eq('id', user.id)
                    .select()
                    .single();
                if (error) throw error;
                set({ profile: updated as UserProfile, isLoading: false });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Step completion failed';
                set({ error: message, isLoading: false });
                throw err;
            }
        },

        // ── Resolve Tenant ────────────────────────────────────────
        // Determines gym + role from the database.
        // Priority: owner > staff > member
        // ──────────────────────────────────────────────────────────

        resolveTenant: async (userId: string) => {
            try {
                // 1. Check if user owns a gym
                const { data: ownedGyms, error: gymError } = await supabase
                    .from('gyms')
                    .select('*')
                    .eq('owner_id', userId)
                    .eq('is_active', true)
                    .limit(1);

                if (gymError) throw gymError;

                if (ownedGyms && ownedGyms.length > 0) {
                    set({
                        gym: ownedGyms[0] as Gym,
                        role: 'owner' as AppRole,
                        isLoading: false,
                    });
                    return;
                }

                // 2. Check if user is staff at any gym
                const { data: staffRecords, error: staffError } = await supabase
                    .from('gym_staff')
                    .select('*, gyms(*)')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .limit(1);

                if (staffError) throw staffError;

                if (staffRecords && staffRecords.length > 0) {
                    const staffRecord = staffRecords[0] as GymStaff & { gyms: Gym };
                    set({
                        gym: staffRecord.gyms,
                        role: staffRecord.role as AppRole,
                        isLoading: false,
                    });
                    return;
                }

                // 3. Check if user is a member at any gym
                const { data: memberRecords, error: memberError } = await supabase
                    .from('members')
                    .select('*, gyms(*)')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .limit(1);

                if (memberError) throw memberError;

                if (memberRecords && memberRecords.length > 0) {
                    const memberRecord = memberRecords[0] as Member & { gyms: Gym };
                    set({
                        gym: memberRecord.gyms,
                        role: 'member' as AppRole,
                        isLoading: false,
                    });
                    return;
                }

                // 4. No gym affiliation found — triggers onboarding
                set({ gym: null, role: null, isLoading: false });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Tenant resolution failed';
                set({ error: message, isLoading: false });
            }
        },

        // ── Selected Gym (pre-login) ──────────────────────────────

        setSelectedGymId: (gymId: string | null) => {
            set({ selectedGymId: gymId });
        },

        // ── Clear ─────────────────────────────────────────────────

        clear: () => {
            _hydrationLock = false;
            set({ ...initialState, isHydrated: true });
        },
    };
});
