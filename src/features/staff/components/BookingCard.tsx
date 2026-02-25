import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StaffBooking } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
    booking: StaffBooking;
    onApprove?: () => void;
    onCancel?: () => void;
    onNoShow?: () => void;
}

export function BookingCard({ booking, onApprove, onCancel, onNoShow }: Props) {
    const name = booking.members?.users?.full_name ?? 'Unknown';
    const isActionable = booking.status === 'booked';

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.timeRow}>
                    <Text style={styles.time}>
                        {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                    </Text>
                    {booking.activity ? (
                        <Text style={styles.activity}>{booking.activity}</Text>
                    ) : null}
                </View>
                <StatusBadge status={booking.status} small />
            </View>

            <Text style={styles.name} numberOfLines={1}>{name}</Text>

            {isActionable ? (
                <View style={styles.actions}>
                    {onApprove ? (
                        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
                            <Text style={styles.approveText}>Check In</Text>
                        </TouchableOpacity>
                    ) : null}
                    {onNoShow ? (
                        <TouchableOpacity style={styles.noShowBtn} onPress={onNoShow}>
                            <Text style={styles.noShowText}>No Show</Text>
                        </TouchableOpacity>
                    ) : null}
                    {onCancel ? (
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    time: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f9fafb',
    },
    activity: {
        fontSize: 12,
        color: '#6b7280',
    },
    name: {
        fontSize: 14,
        color: '#d1d5db',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    approveBtn: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    approveText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },
    noShowBtn: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    noShowText: { color: '#f97316', fontSize: 12, fontWeight: '600' },
    cancelBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    cancelText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
});
