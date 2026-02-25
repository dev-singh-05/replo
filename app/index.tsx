import { useAuthStore } from '@/src/store/auth-store';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Root index — redirect dispatcher.
 * Evaluates auth state and routes to the correct stack.
 * This screen should never be visible for more than a frame.
 */
export default function RootIndex() {
    const router = useRouter();
    const session = useAuthStore((s) => s.session);
    const profile = useAuthStore((s) => s.profile);
    const gym = useAuthStore((s) => s.gym);
    const role = useAuthStore((s) => s.role);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    useEffect(() => {
        if (!isHydrated) return;

        if (!session) {
            router.replace('/(auth)/sign-in' as Href);
            return;
        }

        // Onboarding flow conditionals
        if (profile) {
            if (!profile.first_login_completed) {
                router.replace('/(onboarding)/role-selection' as Href);
                return;
            }
            if (!profile.profile_completed) {
                router.replace('/(onboarding)/complete-profile' as Href);
                return;
            }
            if (profile.role === 'member' && !profile.gym_id && !gym) {
                router.replace('/(onboarding)/join-gym' as Href);
                return;
            }
            if (profile.role === 'owner' && !profile.gym_id && !gym) {
                router.replace('/(onboarding)/create-gym' as Href);
                return;
            }
        }

        // Dashboard routing (tenant resolved)
        if (!gym || !role) {
            // Fallback if tenant resolution fails
            router.replace('/(onboarding)/role-selection' as Href);
            return;
        }

        switch (role) {
            case 'owner':
                router.replace('/(owner)/(tabs)' as Href);
                break;
            case 'manager':
            case 'trainer':
            case 'receptionist':
                router.replace('/(staff)/(tabs)' as Href);
                break;
            case 'member':
                router.replace('/(member)/(tabs)' as Href);
                break;
            default:
                router.replace('/(auth)/sign-in' as Href);
        }
    }, [isHydrated, session, profile, gym, role, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6366f1" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});
