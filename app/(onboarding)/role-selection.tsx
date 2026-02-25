import { useAuth } from '@/src/core/hooks/use-auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const { updateProfileDetails, completeOnboardingStep, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectRole = async (role: 'owner' | 'staff' | 'member') => {
        setIsLoading(true);
        setError(null);
        try {
            await updateProfileDetails({ role });
            await completeOnboardingStep('first_login');
            // Root router will redirect to complete-profile automatically
            router.replace('/');
        } catch (err: any) {
            setError(err.message || 'Failed to set role');
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome back.</Text>
                <Text style={styles.subtitle}>How do you want to use Replo?</Text>
            </View>

            {error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.roleCard, isLoading && styles.disabled]}
                    onPress={() => handleSelectRole('member')}
                    disabled={isLoading}
                >
                    <Text style={styles.roleTitle}>🏋️ Gym Member</Text>
                    <Text style={styles.roleSub}>I want to manage my workouts, diet, and gym schedule.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.roleCard, isLoading && styles.disabled]}
                    onPress={() => handleSelectRole('owner')}
                    disabled={isLoading}
                >
                    <Text style={styles.roleTitle}>🏢 Gym Owner</Text>
                    <Text style={styles.roleSub}>I want to manage my gym, staff, and members.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.roleCard, isLoading && styles.disabled]}
                    onPress={() => handleSelectRole('staff')}
                    disabled={isLoading}
                >
                    <Text style={styles.roleTitle}>💼 Gym Staff</Text>
                    <Text style={styles.roleSub}>I work at a gym and have an invite code.</Text>
                </TouchableOpacity>
            </View>

            {isLoading && (
                <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 24 }} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#f9fafb',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
    },
    buttonGroup: {
        gap: 16,
    },
    roleCard: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 12,
        padding: 20,
    },
    disabled: {
        opacity: 0.5,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f9fafb',
        marginBottom: 6,
    },
    roleSub: {
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
    },
});
