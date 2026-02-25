import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator, Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BookingCard } from '../components/BookingCard';
import { useBookings } from '../hooks/useBookings';

const STATUS_FILTERS = [
    { label: 'All', value: undefined },
    { label: 'Booked', value: 'booked' },
    { label: 'Checked In', value: 'checked_in' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'No Show', value: 'no_show' },
];

export default function BookingManagementScreen() {
    const {
        bookings, filters, setDate, setStatusFilter,
        approveBooking, cancelBooking, markNoShow,
    } = useBookings();

    const shiftDate = (days: number) => {
        const d = new Date(filters.date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const handleAction = async (
        action: 'approve' | 'cancel' | 'noShow',
        id: string
    ) => {
        const actionMap = {
            approve: { fn: approveBooking, msg: 'Check in this booking?', success: 'Checked in' },
            cancel: { fn: cancelBooking, msg: 'Cancel this booking?', success: 'Cancelled' },
            noShow: { fn: markNoShow, msg: 'Mark as no-show?', success: 'Marked no-show' },
        };
        const a = actionMap[action];

        Alert.alert('Confirm', a.msg, [
            { text: 'No' },
            {
                text: 'Yes',
                style: action === 'cancel' ? 'destructive' : 'default',
                onPress: async () => {
                    try {
                        await a.fn.mutate(id);
                        bookings.refetch();
                    } catch (err: any) {
                        Alert.alert('Error', err.message);
                    }
                },
            },
        ]);
    };

    const displayDate = new Date(filters.date).toLocaleDateString('en', {
        weekday: 'short', month: 'short', day: 'numeric',
    });

    return (
        <View style={styles.container}>
            {/* Date Picker */}
            <View style={styles.dateRow}>
                <TouchableOpacity onPress={() => shiftDate(-1)}>
                    <Ionicons name="chevron-back" size={24} color="#9ca3af" />
                </TouchableOpacity>
                <Text style={styles.dateText}>{displayDate}</Text>
                <TouchableOpacity onPress={() => shiftDate(1)}>
                    <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Status Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
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
            </ScrollView>

            {/* Bookings List */}
            {bookings.isLoading ? (
                <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {(bookings.data ?? []).length === 0 ? (
                        <View style={styles.empty}>
                            <Ionicons name="calendar-outline" size={48} color="#374151" />
                            <Text style={styles.emptyText}>No bookings for this date</Text>
                        </View>
                    ) : (
                        (bookings.data ?? []).map((b) => (
                            <BookingCard
                                key={b.id}
                                booking={b}
                                onApprove={() => handleAction('approve', b.id)}
                                onCancel={() => handleAction('cancel', b.id)}
                                onNoShow={() => handleAction('noShow', b.id)}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 56 },
    dateRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, gap: 16,
    },
    dateText: { fontSize: 18, fontWeight: '700', color: '#f9fafb' },
    filterRow: { paddingHorizontal: 16, marginBottom: 16, gap: 6 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
    },
    chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    chipText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
    chipTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: '#6b7280', fontSize: 14 },
});
