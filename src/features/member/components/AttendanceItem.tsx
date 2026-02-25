// ============================================================
// Replo — AttendanceItem Component
// Single attendance record display
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MemberAttendance } from '../types';

interface AttendanceItemProps {
    item: MemberAttendance;
}

function formatTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function computeDuration(checkIn: string, checkOut: string | null): string {
    if (!checkOut) return 'In Progress';
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${remainingMins}m`;
}

export default function AttendanceItem({ item }: AttendanceItemProps) {
    const isActive = !item.check_out_at;

    return (
        <View style={[styles.card, isActive && styles.cardActive]}>
            <View style={styles.iconWrap}>
                <Ionicons
                    name={isActive ? 'log-in' : 'checkmark-circle'}
                    size={20}
                    color={isActive ? '#f59e0b' : '#10b981'}
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.date}>{formatDate(item.check_in_at)}</Text>
                <View style={styles.timeRow}>
                    <Text style={styles.time}>In: {formatTime(item.check_in_at)}</Text>
                    <Text style={styles.time}>
                        Out: {item.check_out_at ? formatTime(item.check_out_at) : '—'}
                    </Text>
                </View>
            </View>
            <View style={styles.durationWrap}>
                <Text style={[styles.duration, isActive && styles.durationActive]}>
                    {computeDuration(item.check_in_at, item.check_out_at)}
                </Text>
            </View>
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
    cardActive: {
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    date: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 2,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 16,
    },
    time: {
        fontSize: 12,
        color: '#6b7280',
    },
    durationWrap: {
        marginLeft: 8,
    },
    duration: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10b981',
    },
    durationActive: {
        color: '#f59e0b',
    },
});
