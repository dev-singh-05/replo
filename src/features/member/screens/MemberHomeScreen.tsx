// ============================================================
// Replo — MemberHomeScreen
// Greeting, subscription summary, quick actions
// ============================================================

import { useAuth } from '@/src/core/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import StatusBadge from '../components/StatusBadge';
import { useGymRequests } from '../hooks/useGymRequests';
import { useMemberHome } from '../hooks/useMemberHome';

const quickActions = [
    { key: 'bookings', label: 'Book Slot', icon: 'calendar' as const, color: '#6366f1', route: '/(member)/bookings' },
    { key: 'attendance', label: 'Attendance', icon: 'log-in' as const, color: '#3b82f6', route: '/(member)/attendance' },
    { key: 'workouts', label: 'Workouts', icon: 'barbell' as const, color: '#10b981', route: '/(member)/workouts' },
    { key: 'diets', label: 'Diet Plans', icon: 'nutrition' as const, color: '#f59e0b', route: '/(member)/diets' },
    { key: 'feedback', label: 'Feedback', icon: 'chatbubble-ellipses' as const, color: '#8b5cf6', route: '/(member)/feedback' },
    { key: 'subscription', label: 'Subscription', icon: 'card' as const, color: '#ec4899', route: '/(member)/subscription' },
];

export default function MemberHomeScreen() {
    const router = useRouter();
    const { gym, signOut } = useAuth();
    const { homeData, isLoading, error, refetch } = useMemberHome();
    const { pendingCount } = useGymRequests();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.role}>MEMBER</Text>
                    <Text style={styles.gymName}>{gym?.name ?? 'My Gym'}</Text>
                    <Text style={styles.greeting}>
                        Hello, {homeData.profile?.full_name ?? 'Member'} 👋
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Pending Request Status */}
            {pendingCount > 0 && (
                <View style={styles.requestBanner}>
                    <View style={styles.requestBannerIcon}>
                        <Ionicons name="time" size={20} color="#f59e0b" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.requestBannerTitle}>
                            {pendingCount} Gym Request{pendingCount > 1 ? 's' : ''} Pending
                        </Text>
                        <Text style={styles.requestBannerSubtext}>
                            Waiting for the gym owner to approve your request
                        </Text>
                    </View>
                    <Ionicons name="hourglass" size={18} color="#f59e0b" />
                </View>
            )}

            {/* Subscription Summary */}
            {isLoading && !homeData.activeSubscription ? (
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="small" color="#f59e0b" />
                    <Text style={styles.loadingText}>Loading subscription...</Text>
                </View>
            ) : homeData.activeSubscription ? (
                <TouchableOpacity
                    style={styles.subCard}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(member)/subscription' as any)}
                >
                    <View style={styles.subHeader}>
                        <Text style={styles.subTitle}>
                            {homeData.activeSubscription.plans?.name ?? 'Active Plan'}
                        </Text>
                        <StatusBadge status="active" size="md" />
                    </View>
                    {homeData.daysRemaining !== null && (
                        <View style={[
                            styles.daysBar,
                            homeData.isExpiringSoon && styles.daysBarWarning,
                        ]}>
                            <Text style={[
                                styles.daysText,
                                homeData.isExpiringSoon && styles.daysTextWarning,
                            ]}>
                                {homeData.daysRemaining === 0
                                    ? '⚠️ Expires today!'
                                    : `${homeData.daysRemaining} day${homeData.daysRemaining !== 1 ? 's' : ''} remaining`}
                            </Text>
                        </View>
                    )}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{homeData.monthlyVisits}</Text>
                            <Text style={styles.statLabel}>Visits this month</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.noSubCard}>
                    <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
                    <Text style={styles.noSubText}>No active subscription</Text>
                    <Text style={styles.noSubHint}>Contact your gym to subscribe</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorCard}>
                    <Text style={styles.errorText}>{error.message}</Text>
                </View>
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.grid}>
                {quickActions.map((action) => (
                    <TouchableOpacity
                        key={action.key}
                        style={styles.tile}
                        activeOpacity={0.7}
                        onPress={() => router.push(action.route as any)}
                    >
                        <View style={[styles.tileIcon, { backgroundColor: action.color + '1A' }]}>
                            <Ionicons name={action.icon} size={24} color={action.color} />
                        </View>
                        <Text style={styles.tileLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    role: { fontSize: 12, fontWeight: '700', color: '#f59e0b', letterSpacing: 2, marginBottom: 4 },
    gymName: { fontSize: 28, fontWeight: '800', color: '#f9fafb' },
    greeting: { fontSize: 16, color: '#9ca3af', marginTop: 4 },
    logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 10 },

    // Subscription Card
    subCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb', flex: 1, marginRight: 8 },
    daysBar: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    daysBarWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    daysText: { fontSize: 13, fontWeight: '600', color: '#10b981', textAlign: 'center' },
    daysTextWarning: { color: '#f59e0b' },
    statsRow: { flexDirection: 'row' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 24, fontWeight: '800', color: '#f9fafb' },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },

    noSubCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        alignItems: 'center',
    },
    noSubText: { fontSize: 16, fontWeight: '600', color: '#f59e0b', marginTop: 8 },
    noSubHint: { fontSize: 13, color: '#6b7280', marginTop: 4 },

    loadingCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: { fontSize: 13, color: '#6b7280' },

    errorCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#d1d5db',
        marginBottom: 12,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
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

    // Gym request banner
    requestBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 12,
        padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    requestBannerIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    requestBannerTitle: { fontSize: 15, fontWeight: '600', color: '#f9fafb' },
    requestBannerSubtext: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
