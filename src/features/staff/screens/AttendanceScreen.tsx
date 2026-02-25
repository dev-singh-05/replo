import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert,
    FlatList,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AttendanceCard } from '../components/AttendanceCard';
import { useAttendance } from '../hooks/useAttendance';
import type { StaffMember } from '../types';

export default function AttendanceScreen() {
    const {
        activeCheckins, checkIn, checkOut, searchMembers, searchResults, isSearching,
    } = useAttendance();

    const [query, setQuery] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            searchMembers(text);
        }, 300);
    }, [searchMembers]);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleCheckIn = async (member: StaffMember) => {
        try {
            await checkIn.mutate(member.id);
            Alert.alert('✅ Checked In', `${member.users?.full_name ?? 'Member'} checked in successfully`);
            setQuery('');
            activeCheckins.refetch();
        } catch (err: any) {
            Alert.alert('Check-In Failed', err.message || 'Could not check in');
        }
    };

    const handleCheckOut = async (attendanceId: string) => {
        try {
            await checkOut.mutate(attendanceId);
            activeCheckins.refetch();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not check out');
        }
    };

    return (
        <View style={styles.container}>
            {/* Search for Check-In */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>Check-In Member</Text>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or membership #..."
                        placeholderTextColor="#6b7280"
                        value={query}
                        onChangeText={handleSearch}
                        autoCorrect={false}
                    />
                </View>

                {isSearching && <ActivityIndicator color="#6366f1" style={{ marginTop: 8 }} />}

                {query.length > 0 && searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                        {searchResults.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.resultItem}
                                onPress={() => handleCheckIn(m)}
                                disabled={checkIn.isLoading}
                            >
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultName}>{m.users?.full_name ?? 'Unknown'}</Text>
                                    <Text style={styles.resultSub}>
                                        {m.membership_number ? `#${m.membership_number}` : 'No ID'}
                                    </Text>
                                </View>
                                <Ionicons name="log-in-outline" size={20} color="#22c55e" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {query.length > 0 && !isSearching && searchResults.length === 0 && (
                    <Text style={styles.noResults}>No active members found</Text>
                )}
            </View>

            {/* Active Check-Ins */}
            <View style={styles.activeSection}>
                <Text style={styles.sectionTitle}>
                    Active Check-Ins ({activeCheckins.data?.length ?? 0})
                </Text>
            </View>

            <FlatList
                data={activeCheckins.data ?? []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AttendanceCard
                        attendance={item}
                        onCheckOut={() => handleCheckOut(item.id)}
                    />
                )}
                refreshing={activeCheckins.isLoading}
                onRefresh={activeCheckins.refetch}
                ListEmptyComponent={
                    !activeCheckins.isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#374151" />
                            <Text style={styles.emptyText}>No active check-ins</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 56 },
    searchSection: { paddingHorizontal: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e5e7eb', marginBottom: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937',
        borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#374151',
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#f9fafb', marginLeft: 8 },
    resultsList: {
        backgroundColor: '#111827', borderRadius: 10, marginTop: 8,
        borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden',
    },
    resultItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937',
    },
    resultInfo: { flex: 1 },
    resultName: { fontSize: 14, fontWeight: '600', color: '#e5e7eb' },
    resultSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    noResults: { color: '#6b7280', fontSize: 13, marginTop: 12, textAlign: 'center' },
    activeSection: { paddingHorizontal: 16, marginTop: 12 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
    emptyText: { color: '#6b7280', fontSize: 14 },
});
