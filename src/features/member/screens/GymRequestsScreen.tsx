// ============================================================
// Replo — GymRequestsScreen
// Shows pending gym membership requests with accept/reject
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGymRequests } from '../hooks/useGymRequests';

export default function GymRequestsScreen() {
    const router = useRouter();
    const { requests, isLoading, error, refetch, respondToRequest } = useGymRequests();

    const handleRespond = async (requestId: string, action: 'approved' | 'rejected', gymName: string) => {
        const label = action === 'approved' ? 'accept' : 'reject';

        const doRespond = async () => {
            const result = await respondToRequest(requestId, action);
            if (result.success) {
                const msg = action === 'approved'
                    ? `You've joined ${gymName}! Refresh the app to see it.`
                    : `Request from ${gymName} has been rejected.`;
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Done', msg);
                }
            } else {
                const errMsg = result.error || 'Something went wrong';
                if (Platform.OS === 'web') {
                    window.alert('Error: ' + errMsg);
                } else {
                    Alert.alert('Error', errMsg);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to ${label} this request from ${gymName}?`)) {
                await doRespond();
            }
        } else {
            Alert.alert(
                `${label.charAt(0).toUpperCase() + label.slice(1)} Request`,
                `Are you sure you want to ${label} this request from ${gymName}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: doRespond },
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <Text style={styles.title}>Gym Requests</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />
                }
            >
                {isLoading && requests.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={styles.loadingText}>Loading requests...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle" size={48} color="#374151" />
                        <Text style={styles.emptyTitle}>No pending requests</Text>
                        <Text style={styles.emptySubtext}>
                            When a gym sends you a membership request, it will appear here.
                        </Text>
                    </View>
                ) : (
                    requests.map((req) => {
                        const gymName = req.gyms?.name ?? 'Unknown Gym';
                        const gymLocation = req.gyms?.city
                            ? `${req.gyms.city}, ${req.gyms.country}`
                            : req.gyms?.country ?? '';

                        return (
                            <View key={req.id} style={styles.card}>
                                <View style={styles.cardIcon}>
                                    <Ionicons name="fitness" size={24} color="#6366f1" />
                                </View>
                                <View style={styles.cardBody}>
                                    <Text style={styles.gymName}>{gymName}</Text>
                                    {gymLocation ? (
                                        <Text style={styles.gymLocation}>{gymLocation}</Text>
                                    ) : null}
                                    <Text style={styles.dateText}>
                                        Received {new Date(req.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => handleRespond(req.id, 'approved', gymName)}
                                    >
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleRespond(req.id, 'rejected', gymName)}
                                    >
                                        <Ionicons name="close" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
    content: { paddingHorizontal: 16, paddingBottom: 32 },

    center: { alignItems: 'center', marginTop: 60, gap: 12 },
    loadingText: { color: '#6b7280', fontSize: 14 },

    errorCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10,
        padding: 14, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: { color: '#ef4444', fontSize: 14, flex: 1 },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#9ca3af', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 },

    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#111827', borderRadius: 14, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#1f2937',
    },
    cardIcon: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cardBody: { flex: 1, marginRight: 8 },
    gymName: { fontSize: 16, fontWeight: '700', color: '#f9fafb', marginBottom: 2 },
    gymLocation: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
    dateText: { fontSize: 12, color: '#6b7280' },

    actions: { flexDirection: 'row', gap: 8 },
    acceptBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    },
    rejectBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    },
});
