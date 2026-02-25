import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    currentMonth: number;
    previousMonth: number;
    growthPercentage: number;
    currency: string;
}

export function RevenueChart({ currentMonth, previousMonth, growthPercentage, currency }: Props) {
    const isPositive = growthPercentage >= 0;

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={styles.block}>
                    <Text style={styles.label}>This Month</Text>
                    <Text style={styles.amount}>
                        {currency === 'INR' ? '₹' : currency}{' '}
                        {currentMonth.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.block}>
                    <Text style={styles.label}>Last Month</Text>
                    <Text style={styles.amountSecondary}>
                        {currency === 'INR' ? '₹' : currency}{' '}
                        {previousMonth.toLocaleString()}
                    </Text>
                </View>
            </View>

            <View style={styles.growthRow}>
                <Ionicons
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={isPositive ? '#22c55e' : '#ef4444'}
                />
                <Text
                    style={[styles.growthText, { color: isPositive ? '#22c55e' : '#ef4444' }]}
                >
                    {isPositive ? '+' : ''}
                    {growthPercentage}%
                </Text>
                <Text style={styles.growthLabel}>vs last month</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    block: {},
    label: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    amount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f9fafb',
    },
    amountSecondary: {
        fontSize: 20,
        fontWeight: '600',
        color: '#9ca3af',
    },
    growthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    growthText: {
        fontSize: 16,
        fontWeight: '700',
    },
    growthLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
    },
});
