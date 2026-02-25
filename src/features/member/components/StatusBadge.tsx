// ============================================================
// Replo — StatusBadge Component
// Reusable color-coded status indicator
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
    expired: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    cancelled: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' },
    paused: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    booked: { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1' },
    checked_in: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
    no_show: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    reviewed: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
    resolved: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
    dismissed: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' },
};

const DEFAULT_COLOR = { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' };

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const colors = STATUS_COLORS[status] ?? DEFAULT_COLOR;
    const label = status.replace(/_/g, ' ').toUpperCase();

    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }, size === 'md' && styles.badgeMd]}>
            <Text style={[styles.text, { color: colors.text }, size === 'md' && styles.textMd]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeMd: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textMd: {
        fontSize: 12,
    },
});
