import { useAuth } from '@/src/core/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tileConfig = [
    { key: 'members', label: 'Members', icon: 'people' as const, color: '#6366f1', segment: 'member-list' },
    { key: 'attendance', label: 'Attendance', icon: 'log-in' as const, color: '#3b82f6', segment: 'attendance' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar' as const, color: '#10b981', segment: 'bookings' },
    { key: 'subscriptions', label: 'Subscriptions', icon: 'card' as const, color: '#f59e0b', segment: 'subscriptions' },
    { key: 'equipment', label: 'Equipment', icon: 'build' as const, color: '#ef4444', segment: 'equipment-reports' },
];

export default function StaffHomeScreen() {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, gym, role, signOut } = useAuth();

    // Detect if we're in owner or staff layout
    const routePrefix = pathname.includes('(owner)') || role === 'owner' ? '/(owner)' : '/(staff)';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.role}>{role?.toUpperCase() ?? 'STAFF'}</Text>
                    <Text style={styles.gymName}>{gym?.name ?? 'Gym'}</Text>
                    <Text style={styles.greeting}>Hello, {profile?.full_name ?? 'Staff'}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {tileConfig.map((tile) => (
                    <TouchableOpacity
                        key={tile.key}
                        style={styles.tile}
                        activeOpacity={0.7}
                        onPress={() => router.push(`${routePrefix}/${tile.segment}` as any)}
                    >
                        <View style={[styles.tileIcon, { backgroundColor: tile.color + '1A' }]}>
                            <Ionicons name={tile.icon} size={24} color={tile.color} />
                        </View>
                        <Text style={styles.tileLabel}>{tile.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    role: { fontSize: 12, fontWeight: '700', color: '#10b981', letterSpacing: 2, marginBottom: 4 },
    gymName: { fontSize: 28, fontWeight: '800', color: '#f9fafb' },
    greeting: { fontSize: 16, color: '#9ca3af', marginTop: 4 },
    logoutBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tile: {
        width: '48%',
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
        alignItems: 'center',
    },
    tileIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    tileLabel: { fontSize: 14, fontWeight: '600', color: '#e5e7eb' },
});
