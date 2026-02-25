import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBadge } from '../components/StatusBadge';
import { useEquipmentReports } from '../hooks/useEquipmentReports';

const SEVERITY_FILTERS = [
    { label: 'All', value: undefined },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
];

const STATUS_FILTERS = [
    { label: 'All', value: undefined },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
];

export default function EquipmentReportsScreen() {
    const {
        data, isLoading, isFetchingMore, hasMore, loadMore, refetch,
        filters, setSeverityFilter, setStatusFilter,
        markInProgress, markResolved,
    } = useEquipmentReports();

    const handleAction = async (action: 'progress' | 'resolve', id: string) => {
        const fn = action === 'progress' ? markInProgress : markResolved;
        const msg = action === 'progress' ? 'Mark as in progress?' : 'Mark as resolved?';

        Alert.alert('Confirm', msg, [
            { text: 'No' },
            {
                text: 'Yes',
                onPress: async () => {
                    try {
                        await fn.mutate(id);
                        refetch();
                    } catch (err: any) {
                        Alert.alert('Error', err.message);
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Equipment Reports</Text>

            {/* Severity Filter */}
            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Severity</Text>
                <View style={styles.filterRow}>
                    {SEVERITY_FILTERS.map((opt) => (
                        <TouchableOpacity
                            key={opt.label}
                            style={[styles.chip, filters.severity === opt.value && styles.chipActive]}
                            onPress={() => setSeverityFilter(opt.value)}
                        >
                            <Text style={[styles.chipText, filters.severity === opt.value && styles.chipTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterRow}>
                    {STATUS_FILTERS.map((opt) => (
                        <TouchableOpacity
                            key={opt.label}
                            style={[styles.chip, filters.status === opt.value && styles.chipActive]}
                            onPress={() => setStatusFilter(opt.value)}
                        >
                            <Text style={[styles.chipText, filters.status === opt.value && styles.chipTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.reportCard}>
                        <View style={styles.reportHeader}>
                            <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
                            <StatusBadge status={item.severity} small />
                        </View>
                        <Text style={styles.reportEquipment}>
                            {item.equipment?.name ?? 'Equipment'} · {item.equipment?.category ?? ''}
                        </Text>
                        {item.description ? (
                            <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        <View style={styles.reportFooter}>
                            <StatusBadge status={item.status} small />
                            <View style={styles.reportActions}>
                                {item.status === 'open' ? (
                                    <TouchableOpacity
                                        style={styles.progressBtn}
                                        onPress={() => handleAction('progress', item.id)}
                                    >
                                        <Text style={styles.progressText}>In Progress</Text>
                                    </TouchableOpacity>
                                ) : null}
                                {item.status === 'open' || item.status === 'in_progress' ? (
                                    <TouchableOpacity
                                        style={styles.resolveBtn}
                                        onPress={() => handleAction('resolve', item.id)}
                                    >
                                        <Text style={styles.resolveText}>Resolve</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    </View>
                )}
                onEndReached={() => { if (hasMore) loadMore(); }}
                onEndReachedThreshold={0.3}
                refreshing={isLoading}
                onRefresh={refetch}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#374151" />
                            <Text style={styles.emptyText}>No reports found</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    isFetchingMore ? <ActivityIndicator color="#6366f1" style={{ paddingVertical: 16 }} /> : null
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 56 },
    title: { fontSize: 24, fontWeight: '700', color: '#f9fafb', paddingHorizontal: 16, marginBottom: 12 },
    filterSection: { paddingHorizontal: 16, marginBottom: 8 },
    filterLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
    filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    chip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
        backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
    },
    chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    chipText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
    chipTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },
    reportCard: {
        backgroundColor: '#111827', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#1f2937', marginBottom: 8,
    },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reportTitle: { fontSize: 14, fontWeight: '600', color: '#e5e7eb', flex: 1, marginRight: 8 },
    reportEquipment: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    reportDesc: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
    reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    reportActions: { flexDirection: 'row', gap: 8 },
    progressBtn: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    progressText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
    resolveBtn: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    resolveText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: '#6b7280', fontSize: 14 },
});
