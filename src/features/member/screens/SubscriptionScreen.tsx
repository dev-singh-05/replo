// ============================================================
// Replo — SubscriptionScreen
// Full subscription history for members
// ============================================================

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
import SubscriptionCard from '../components/SubscriptionCard';
import { useMemberSubscription } from '../hooks/useMemberSubscription';

export default function SubscriptionScreen() {
    const router = useRouter();
    const { subscriptions, isLoading, error, refetch } = useMemberSubscription();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Subscriptions</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />
                }
            >
                {isLoading && subscriptions.length === 0 && (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                    </View>
                )}

                {error && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error.message}</Text>
                    </View>
                )}

                {!isLoading && subscriptions.length === 0 && !error && (
                    <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={48} color="#374151" />
                        <Text style={styles.emptyTitle}>No Subscriptions</Text>
                        <Text style={styles.emptyHint}>
                            Your subscription history will appear here
                        </Text>
                    </View>
                )}

                {subscriptions.map((sub) => (
                    <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
    },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
    content: { paddingHorizontal: 16, paddingBottom: 24 },
    center: { paddingTop: 60, alignItems: 'center' },
    errorCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#4b5563', marginTop: 4 },
});
