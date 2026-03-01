import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { MemberCard } from '../components/MemberCard';
import { useIncomingRequests } from '../hooks/useIncomingRequests';
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
    const { requests: incomingRequests, pendingCount, rejectRequest, markApproved, refetch: refetchRequests } = useIncomingRequests();

    const handleAccept = (req: typeof incomingRequests[0]) => {
        // Navigate to CreateMember with pre-filled user data
        const params = new URLSearchParams({
            requestId: req.id,
            userId: req.user_id,
            name: req.users?.full_name || '',
            phone: req.users?.phone || '',
        });
        router.push(`${routePrefix}/create-member?${params.toString()}` as any);
    };

    const handleReject = async (req: typeof incomingRequests[0]) => {
        const gymName = req.users?.full_name || 'this user';
        const doReject = async () => {
            const result = await rejectRequest(req.id);
            if (!result.success) {
                const msg = result.error || 'Failed to reject';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
            }
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Reject request from ${gymName}?`)) await doReject();
        } else {
            Alert.alert('Reject Request', `Reject request from ${gymName}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reject', style: 'destructive', onPress: doReject },
            ]);
        }
    };

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

            {/* Incoming Requests */}
            {pendingCount > 0 && (
                <View style={styles.requestsSection}>
                    <Text style={styles.requestsTitle}>
                        📩 {pendingCount} Join Request{pendingCount > 1 ? 's' : ''}
                    </Text>
                    {incomingRequests.map((req) => (
                        <View key={req.id} style={styles.reqCard}>
                            <View style={styles.reqInfo}>
                                <Text style={styles.reqName}>{req.users?.full_name || 'Unknown'}</Text>
                                <Text style={styles.reqPhone}>{req.users?.phone || 'No phone'}</Text>
                                <Text style={styles.reqDate}>
                                    {new Date(req.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.reqActions}>
                                <TouchableOpacity
                                    style={styles.reqAcceptBtn}
                                    onPress={() => handleAccept(req)}
                                >
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                    <Text style={styles.reqAcceptText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.reqRejectBtn}
                                    onPress={() => handleReject(req)}
                                >
                                    <Ionicons name="close" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

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
    // Incoming requests
    requestsSection: {
        marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    requestsTitle: { fontSize: 15, fontWeight: '700', color: '#f9fafb', marginBottom: 10 },
    reqCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
        borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937',
    },
    reqInfo: { flex: 1 },
    reqName: { fontSize: 15, fontWeight: '600', color: '#f9fafb', marginBottom: 2 },
    reqPhone: { fontSize: 13, color: '#9ca3af' },
    reqDate: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    reqActions: { flexDirection: 'row', gap: 6 },
    reqAcceptBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#22c55e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    reqAcceptText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    reqRejectBtn: {
        width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    },
});
