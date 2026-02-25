import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { StatusBadge } from '../components/StatusBadge';
import { useMemberDetail } from '../hooks/useMemberDetail';

export default function MemberDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { member, subscriptions, attendance, refetchAll } = useMemberDetail(id ?? null);

    if (member.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    const m = member.data;
    if (!m) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Member not found</Text>
            </View>
        );
    }

    const name = m.users?.full_name ?? 'Unknown';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#9ca3af" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Profile Header */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#6366f1" />
                </View>
                <Text style={styles.name}>{name}</Text>
                {m.membership_number ? (
                    <Text style={styles.memberId}>#{m.membership_number}</Text>
                ) : null}
                <StatusBadge status={m.status} />
                {m.users?.phone ? <Text style={styles.detail}>📞 {m.users.phone}</Text> : null}
                {m.emergency_contact ? <Text style={styles.detail}>🚨 {m.emergency_contact}</Text> : null}
                {m.health_notes ? <Text style={styles.detail}>🩺 {m.health_notes}</Text> : null}
                <Text style={styles.detail}>
                    Joined {new Date(m.joined_at).toLocaleDateString()}
                </Text>
            </View>

            {/* Subscriptions */}
            <Text style={styles.sectionTitle}>Subscriptions</Text>
            {subscriptions.isLoading ? (
                <ActivityIndicator color="#6366f1" />
            ) : (subscriptions.data ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No subscriptions</Text>
            ) : (
                (subscriptions.data ?? []).map((sub) => (
                    <View key={sub.id} style={styles.subCard}>
                        <View style={styles.subRow}>
                            <Text style={styles.subPlan}>{sub.plans?.name ?? 'Plan'}</Text>
                            <StatusBadge status={sub.status} small />
                        </View>
                        <Text style={styles.subDates}>
                            {sub.start_date} → {sub.end_date}
                        </Text>
                        <Text style={styles.subAmount}>₹{sub.amount_paid}</Text>
                    </View>
                ))
            )}

            {/* Attendance History */}
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            {attendance.isLoading ? (
                <ActivityIndicator color="#6366f1" />
            ) : (attendance.data ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No attendance records</Text>
            ) : (
                (attendance.data ?? []).slice(0, 10).map((a) => (
                    <View key={a.id} style={styles.attendanceRow}>
                        <Text style={styles.attendanceDate}>
                            {new Date(a.check_in_at).toLocaleDateString()}
                        </Text>
                        <Text style={styles.attendanceTime}>
                            {new Date(a.check_in_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            {a.check_out_at
                                ? ` → ${new Date(a.check_out_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`
                                : ' (active)'}
                        </Text>
                    </View>
                ))
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backText: { color: '#9ca3af', fontSize: 15 },
    profileCard: {
        backgroundColor: '#111827', borderRadius: 14, padding: 20,
        borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', marginBottom: 24,
    },
    avatar: {
        width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    name: { fontSize: 22, fontWeight: '800', color: '#f9fafb', marginBottom: 4 },
    memberId: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
    detail: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e5e7eb', marginBottom: 12, marginTop: 8 },
    emptyText: { color: '#6b7280', fontSize: 13, marginBottom: 16 },
    subCard: {
        backgroundColor: '#111827', borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: '#1f2937', marginBottom: 8,
    },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    subPlan: { fontSize: 14, fontWeight: '600', color: '#e5e7eb' },
    subDates: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    subAmount: { fontSize: 14, fontWeight: '700', color: '#22c55e', marginTop: 4 },
    attendanceRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: '#111827', borderRadius: 8, padding: 12,
        borderWidth: 1, borderColor: '#1f2937', marginBottom: 6,
    },
    attendanceDate: { fontSize: 13, color: '#d1d5db' },
    attendanceTime: { fontSize: 13, color: '#9ca3af' },
});
