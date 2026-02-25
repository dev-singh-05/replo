// ============================================================
// Replo — useProtectedRoute Hook
// Route guard that redirects unauthorized users
// ============================================================

import { useAuthStore } from '@/src/store/auth-store';
import type { AppRole } from '@/src/types/auth';
import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect } from 'react';

/**
 * Protects a route group by verifying the user's role.
 * If the role doesn't match, redirects to the correct route.
 *
 * Usage in a route group _layout.tsx:
 *   useProtectedRoute(['owner']);
 *   useProtectedRoute(['manager', 'trainer', 'receptionist']);
 *   useProtectedRoute(['member']);
 */
export function useProtectedRoute(allowedRoles: AppRole[]) {
    const router = useRouter();
    const segments = useSegments();
    const session = useAuthStore((s) => s.session);
    const role = useAuthStore((s) => s.role);
    const profile = useAuthStore((s) => s.profile);
    const gym = useAuthStore((s) => s.gym);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    useEffect(() => {
        if (!isHydrated) return;

        // Not authenticated → auth stack
        if (!session) {
            router.replace('/(auth)/sign-in');
            return;
        }

        // Determine effective role: tenant role takes priority, fallback to profile role
        const effectiveRole = role || profile?.role;

        // Authenticated but no gym and not a member → onboarding
        if (!gym && profile?.role !== 'member') {
            router.replace('/(onboarding)/role-selection' as Href);
            return;
        }

        // Role doesn't match allowed roles → redirect to correct stack
        const roleToCheck = effectiveRole as AppRole | 'staff' | null;
        if (!roleToCheck || !allowedRoles.includes(roleToCheck as AppRole)) {
            const target = getRouteForRole(roleToCheck);
            const currentGroup = segments[0];
            if (currentGroup !== target.replace(/[()\/]/g, '')) {
                router.replace(target as Href);
            }
        }
    }, [isHydrated, session, role, profile, gym, allowedRoles, segments, router]);
}

/**
 * Maps a role to its correct route group entry point.
 */
function getRouteForRole(role: AppRole | 'staff' | null): string {
    switch (role) {
        case 'owner':
            return '/(owner)';
        case 'staff': // Generic staff from onboarding
        case 'manager':
        case 'trainer':
        case 'receptionist':
            return '/(staff)';
        case 'member':
            return '/(member)';
        default:
            return '/(auth)/sign-in';
    }
}
