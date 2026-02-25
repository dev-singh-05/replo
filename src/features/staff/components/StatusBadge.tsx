import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const colorMap: Record<string, { bg: string; text: string }> = {
    active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    inactive: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
    suspended: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    expired: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    paused: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    booked: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
    checked_in: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    no_show: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    open: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
    in_progress: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    closed: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
    low: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    high: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
    critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};

interface Props {
    status: string;
    small?: boolean;
}

export function StatusBadge({ status, small }: Props) {
    const colors = colorMap[status] ?? colorMap.inactive;

    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }, small && styles.badgeSmall]}>
            <Text style={[styles.text, { color: colors.text }, small && styles.textSmall]}>
                {status.replace(/_/g, ' ')}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textSmall: {
        fontSize: 9,
    },
});
