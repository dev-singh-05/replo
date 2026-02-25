// ============================================================
// Replo — SlotBookingScreen
// View available slots, create / cancel bookings
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import BookingCard from '../components/BookingCard';
import { useMemberBookings } from '../hooks/useMemberBookings';

// Generate next 7 dates for quick date selection
function getNextDates(count: number) {
    const dates: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        dates.push({
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
            value: d.toISOString().split('T')[0],
        });
    }
    return dates;
}

const TIME_SLOTS = [
    { start: '06:00', end: '07:00' },
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
];

function formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
}

export default function SlotBookingScreen() {
    const router = useRouter();
    const dates = getNextDates(7);
    const {
        myBookings, availableSlots, selectedDate, changeDate, isPastDate,
        createBooking, cancelBooking,
    } = useMemberBookings();

    const [activity, setActivity] = useState('');

    // Determine which slots are already taken
    const takenSlots = new Set(
        (availableSlots.data ?? []).map(s => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
    );

    const handleBook = async (start: string, end: string) => {
        try {
            await createBooking.mutate({
                slot_date: selectedDate,
                start_time: start,
                end_time: end,
                activity: activity.trim() || undefined,
            });
            myBookings.refetch();
            availableSlots.refetch();
            Alert.alert('Success', 'Slot booked successfully!');
        } catch (err: any) {
            Alert.alert('Booking Failed', err.message || 'Could not book the slot.');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelBooking.mutate(id);
            myBookings.refetch();
            availableSlots.refetch();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not cancel.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Book a Slot</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Date Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRow}
            >
                {dates.map((d) => (
                    <TouchableOpacity
                        key={d.value}
                        style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
                        onPress={() => changeDate(d.value)}
                    >
                        <Text style={[styles.dateText, selectedDate === d.value && styles.dateTextActive]}>
                            {d.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={myBookings.isLoading}
                        onRefresh={() => { myBookings.refetch(); availableSlots.refetch(); }}
                        tintColor="#f59e0b"
                    />
                }
            >
                {/* Activity Input */}
                {!isPastDate && (
                    <View style={styles.activityInput}>
                        <Text style={styles.inputLabel}>Activity (optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={activity}
                            onChangeText={setActivity}
                            placeholder="e.g., Cardio, Yoga, Weight Training"
                            placeholderTextColor="#4b5563"
                            maxLength={100}
                        />
                    </View>
                )}

                {/* Available Slots */}
                <Text style={styles.sectionTitle}>
                    {isPastDate ? 'Past date — booking disabled' : 'Available Slots'}
                </Text>

                {availableSlots.isLoading ? (
                    <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 16 }} />
                ) : (
                    <View style={styles.slotsGrid}>
                        {TIME_SLOTS.map((slot) => {
                            const key = `${slot.start}-${slot.end}`;
                            const isTaken = takenSlots.has(key);
                            const disabled = isPastDate || isTaken || createBooking.isLoading;

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.slotChip,
                                        isTaken && styles.slotChipTaken,
                                        disabled && styles.slotChipDisabled,
                                    ]}
                                    disabled={disabled}
                                    onPress={() => handleBook(slot.start, slot.end)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.slotText,
                                        isTaken && styles.slotTextTaken,
                                        disabled && styles.slotTextDisabled,
                                    ]}>
                                        {formatTime(slot.start)}
                                    </Text>
                                    <Text style={[
                                        styles.slotSubtext,
                                        disabled && styles.slotTextDisabled,
                                    ]}>
                                        {isTaken ? 'Taken' : 'Available'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {createBooking.isLoading && (
                    <View style={styles.bookingLoader}>
                        <ActivityIndicator size="small" color="#6366f1" />
                        <Text style={styles.bookingLoaderText}>Booking...</Text>
                    </View>
                )}

                {/* My Bookings for this date */}
                <Text style={styles.sectionTitle}>
                    Your Bookings ({(myBookings.data ?? []).length})
                </Text>

                {(myBookings.data ?? []).length === 0 && !myBookings.isLoading && (
                    <View style={styles.emptyBookings}>
                        <Text style={styles.emptyText}>No bookings for this date</Text>
                    </View>
                )}

                {(myBookings.data ?? []).map((b) => (
                    <BookingCard
                        key={b.id}
                        booking={b}
                        onCancel={handleCancel}
                        isCancelling={cancelBooking.isLoading}
                    />
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
        paddingBottom: 12,
    },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },

    dateRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    dateChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    dateChipActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366f1',
    },
    dateText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
    dateTextActive: { color: '#6366f1', fontWeight: '700' },

    content: { paddingHorizontal: 16, paddingBottom: 32 },

    activityInput: { marginBottom: 16, marginTop: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
    textInput: {
        backgroundColor: '#111827',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1f2937',
        padding: 12,
        fontSize: 14,
        color: '#f9fafb',
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#d1d5db',
        marginBottom: 10,
        marginTop: 8,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    slotChip: {
        width: '30%',
        backgroundColor: '#111827',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    slotChipTaken: { borderColor: 'rgba(239, 68, 68, 0.3)' },
    slotChipDisabled: { opacity: 0.5 },
    slotText: { fontSize: 13, fontWeight: '600', color: '#e5e7eb' },
    slotTextTaken: { color: '#ef4444' },
    slotTextDisabled: { color: '#4b5563' },
    slotSubtext: { fontSize: 10, color: '#10b981', marginTop: 2, fontWeight: '500' },

    bookingLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        justifyContent: 'center',
    },
    bookingLoaderText: { fontSize: 13, color: '#6366f1' },

    emptyBookings: {
        backgroundColor: '#111827',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    emptyText: { fontSize: 13, color: '#6b7280' },
});
