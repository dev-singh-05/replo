import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { MemberCard } from '../components/MemberCard';
import { useMembers } from '../hooks/useMembers';

const STATUS_OPTIONS = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Expired', value: 'expired' },
];

export default function MemberListScreen() {
    const router = useRouter();
    const pathname = usePathname();
    const routePrefix = pathname.includes('owner') ? '/(owner)' : '/(staff)';
    const {
        data, isLoading, isFetchingMore, hasMore, loadMore, refetch,
        filters, setSearch, setStatusFilter,
    } = useMembers();

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or ID..."
                        placeholderTextColor="#6b7280"
                        value={filters.search || ''}
                        onChangeText={setSearch}
                        autoCorrect={false}
                    />
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push(`${routePrefix}/create-member` as any)}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <View style={styles.filterRow}>
                {STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.label}
                        style={[styles.filterChip, filters.status === opt.value && styles.filterChipActive]}
                        onPress={() => setStatusFilter(opt.value)}
                    >
                        <Text style={[styles.filterText, filters.status === opt.value && styles.filterTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Member List */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MemberCard
                        member={item}
                        onPress={() => router.push(`${routePrefix}/member-detail?id=${item.id}` as any)}
                    />
                )}
                onEndReached={() => { if (hasMore) loadMore(); }}
                onEndReachedThreshold={0.3}
                refreshing={isLoading}
                onRefresh={refetch}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color="#374151" />
                            <Text style={styles.emptyText}>No members found</Text>
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
    searchRow: {
        flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8,
    },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1f2937', borderRadius: 10, paddingHorizontal: 12,
        borderWidth: 1, borderColor: '#374151',
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#f9fafb', marginLeft: 8 },
    addBtn: {
        backgroundColor: '#6366f1', width: 48, height: 48, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    filterRow: {
        flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 6,
    },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
    },
    filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    filterText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    filterTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: '#6b7280', fontSize: 14 },
});
