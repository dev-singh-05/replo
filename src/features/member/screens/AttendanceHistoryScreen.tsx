// ============================================================
// Replo — AttendanceHistoryScreen
// Paginated attendance with month filter and visit count
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AttendanceItem from '../components/AttendanceItem';
import { useMemberAttendance } from '../hooks/useMemberAttendance';

const MONTHS = (() => {
    const result: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({
            label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        });
    }
    return result;
})();

export default function AttendanceHistoryScreen() {
    const router = useRouter();
    const { attendance, monthlyVisits, filters, setMonth } = useMemberAttendance();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Attendance</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Month Filter */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={MONTHS}
                keyExtractor={(m) => m.value}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item: m }) => (
                    <TouchableOpacity
                        style={[styles.filterChip, filters.month === m.value && styles.filterChipActive]}
                        onPress={() => setMonth(m.value)}
                    >
                        <Text style={[styles.filterText, filters.month === m.value && styles.filterTextActive]}>
                            {m.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Visit Count Summary */}
            <View style={styles.summaryBar}>
                <Ionicons name="footsteps-outline" size={18} color="#10b981" />
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryCount}>{monthlyVisits}</Text> visits this month
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={attendance.data}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <AttendanceItem item={item} />}
                onEndReached={attendance.loadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={
                    !attendance.isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="log-in-outline" size={48} color="#374151" />
                            <Text style={styles.emptyTitle}>No Attendance Records</Text>
                            <Text style={styles.emptyHint}>Check in at your gym to start tracking</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    attendance.isLoading || attendance.isFetchingMore ? (
                        <View style={styles.footer}>
                            <ActivityIndicator size="small" color="#f59e0b" />
                        </View>
                    ) : null
                }
            />
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
        paddingBottom: 12,
    },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },

    filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    filterChipActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3b82f6',
    },
    filterText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
    filterTextActive: { color: '#3b82f6', fontWeight: '600' },

    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 10,
    },
    summaryText: { fontSize: 14, color: '#9ca3af' },
    summaryCount: { fontWeight: '700', color: '#10b981' },

    list: { paddingHorizontal: 16, paddingBottom: 24 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#4b5563', marginTop: 4 },
    footer: { paddingVertical: 16, alignItems: 'center' },
});
