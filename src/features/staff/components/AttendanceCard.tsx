import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StaffAttendance } from '../types';

interface Props {
    attendance: StaffAttendance;
    onCheckOut?: () => void;
}

export function AttendanceCard({ attendance, onCheckOut }: Props) {
    const name = attendance.members?.users?.full_name ?? 'Unknown';
    const memberId = attendance.members?.membership_number ?? '';
    const checkInTime = new Date(attendance.check_in_at).toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const isCheckedOut = !!attendance.check_out_at;

    return (
        <View style={styles.card}>
            <View style={styles.timeCol}>
                <Ionicons
                    name={isCheckedOut ? 'checkmark-circle' : 'radio-button-on'}
                    size={18}
                    color={isCheckedOut ? '#22c55e' : '#3b82f6'}
                />
                <Text style={styles.time}>{checkInTime}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                {memberId ? <Text style={styles.sub}>#{memberId}</Text> : null}
            </View>
            {!isCheckedOut && onCheckOut ? (
                <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckOut}>
                    <Text style={styles.checkoutText}>Check Out</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.doneText}>
                    {attendance.check_out_at
                        ? new Date(attendance.check_out_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    timeCol: {
        alignItems: 'center',
        marginRight: 12,
        width: 50,
    },
    time: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    sub: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    checkoutBtn: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    checkoutText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
    },
    doneText: {
        color: '#22c55e',
        fontSize: 12,
        fontWeight: '500',
    },
});
