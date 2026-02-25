// ============================================================
// Replo — SubscriptionCard Component
// Displays subscription details with plan info and expiry warning
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EnrichedSubscription } from '../hooks/useMemberSubscription';
import StatusBadge from './StatusBadge';

interface SubscriptionCardProps {
    subscription: EnrichedSubscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
    const planName = subscription.plans?.name ?? 'Unknown Plan';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.planName}>{planName}</Text>
                <StatusBadge status={subscription.status} size="md" />
            </View>

            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>{formatDate(subscription.start_date)}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>End Date</Text>
                    <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={styles.detailValue}>₹{subscription.amount_paid.toFixed(0)}</Text>
                </View>
                {subscription.payment_method && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue}>
                            {subscription.payment_method.toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {subscription.daysRemaining !== null && subscription.status === 'active' && (
                <View style={[
                    styles.daysBar,
                    subscription.isExpiringSoon && styles.daysBarWarning,
                ]}>
                    <Text style={[
                        styles.daysText,
                        subscription.isExpiringSoon && styles.daysTextWarning,
                    ]}>
                        {subscription.daysRemaining === 0
                            ? 'Expires today!'
                            : `${subscription.daysRemaining} day${subscription.daysRemaining !== 1 ? 's' : ''} remaining`}
                    </Text>
                </View>
            )}

            {subscription.isExpired && (
                <View style={styles.expiredBar}>
                    <Text style={styles.expiredText}>This subscription has expired</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f9fafb',
        flex: 1,
        marginRight: 8,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        width: '50%',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        color: '#e5e7eb',
        fontWeight: '500',
    },
    daysBar: {
        marginTop: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    daysBarWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    daysText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10b981',
        textAlign: 'center',
    },
    daysTextWarning: {
        color: '#f59e0b',
    },
    expiredBar: {
        marginTop: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    expiredText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
        textAlign: 'center',
    },
});
