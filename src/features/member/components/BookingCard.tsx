// ============================================================
// Replo — BookingCard Component
// Slot booking display with cancel action
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MemberBooking } from '../types';
import StatusBadge from './StatusBadge';

interface BookingCardProps {
    booking: MemberBooking;
    onCancel?: (id: string) => void;
    isCancelling?: boolean;
}

function formatTime(time: string): string {
    // time is HH:MM:SS or HH:MM
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
}

export default function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
    const today = new Date().toISOString().split('T')[0];
    const canCancel = booking.status === 'booked' && booking.slot_date >= today && !!onCancel;

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            `Are you sure you want to cancel your ${formatTime(booking.start_time)} – ${formatTime(booking.end_time)} slot?`,
            [
                { text: 'Keep', style: 'cancel' },
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: () => onCancel?.(booking.id),
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.timeBlock}>
                    <Ionicons name="time-outline" size={16} color="#6366f1" />
                    <Text style={styles.timeText}>
                        {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                    </Text>
                </View>
                <StatusBadge status={booking.status} />
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.dateText}>{formatDate(booking.slot_date)}</Text>
                {booking.activity && (
                    <Text style={styles.activity}>{booking.activity}</Text>
                )}
            </View>

            {canCancel && (
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    disabled={isCancelling}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                    <Text style={styles.cancelText}>
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    activity: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: '500',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
    },
});
