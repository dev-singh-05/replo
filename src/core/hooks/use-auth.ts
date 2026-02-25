// ============================================================
// Replo — useAuth Hook
// Thin selector layer over the Zustand auth store
// ============================================================

import { useAuthStore } from '@/src/store/auth-store';

/**
 * Primary auth hook.
 * Returns all auth state and actions.
 *
 * For fine-grained subscriptions (preventing re-renders),
 * use useAuthStore with a selector directly:
 *   const role = useAuthStore(s => s.role);
 */
export function useAuth() {
    const session = useAuthStore((s) => s.session);
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);
    const gym = useAuthStore((s) => s.gym);
    const role = useAuthStore((s) => s.role);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const error = useAuthStore((s) => s.error);

    const initialize = useAuthStore((s) => s.initialize);
    const signIn = useAuthStore((s) => s.signIn);
    const signUp = useAuthStore((s) => s.signUp);
    const signOut = useAuthStore((s) => s.signOut);
    const createGym = useAuthStore((s) => s.createGym);
    const refreshProfile = useAuthStore((s) => s.refreshProfile);
    const updateProfileDetails = useAuthStore((s) => s.updateProfileDetails);
    const completeOnboardingStep = useAuthStore((s) => s.completeOnboardingStep);
    const resolveTenant = useAuthStore((s) => s.resolveTenant);
    const clear = useAuthStore((s) => s.clear);

    return {
        // State
        session,
        user,
        profile,
        gym,
        role,
        isHydrated,
        isLoading,
        error,
        // Derived
        isAuthenticated: !!session,
        isOwner: role === 'owner',
        isStaff: role === 'manager' || role === 'trainer' || role === 'receptionist',
        isMember: role === 'member',
        needsOnboarding: !!session && !gym,
        // Actions
        initialize,
        signIn,
        signUp,
        signOut,
        createGym,
        refreshProfile,
        updateProfileDetails,
        completeOnboardingStep,
        resolveTenant,
        clear,
    };
}
