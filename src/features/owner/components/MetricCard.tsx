import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    suffix?: string;
}

export function MetricCard({ label, value, icon, color = '#6366f1', suffix }: Props) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: color + '1A' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.value}>
                {value ?? '—'}{suffix ? ` ${suffix}` : ''}
            </Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
        width: '48%',
        marginBottom: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f9fafb',
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
});
