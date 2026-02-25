import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AlertItem {
    id: string;
    title: string;
    subtitle?: string;
    severity?: string;
}

interface Props {
    items: AlertItem[];
    emptyMessage?: string;
}

const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#6b7280',
};

export function AlertList({ items, emptyMessage = 'No alerts' }: Props) {
    if (!items || items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {items.map((item, i) => (
                <View
                    key={item.id}
                    style={[styles.row, i < items.length - 1 && styles.rowBorder]}
                >
                    <View
                        style={[
                            styles.dot,
                            { backgroundColor: severityColors[item.severity ?? 'low'] ?? '#6b7280' },
                        ]}
                    />
                    <View style={styles.content}>
                        <Text style={styles.title} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {item.subtitle ? (
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {item.subtitle}
                            </Text>
                        ) : null}
                    </View>
                    {item.severity ? (
                        <View
                            style={[
                                styles.badge,
                                { backgroundColor: (severityColors[item.severity] ?? '#6b7280') + '1A' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeText,
                                    { color: severityColors[item.severity] ?? '#6b7280' },
                                ]}
                            >
                                {item.severity}
                            </Text>
                        </View>
                    ) : null}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1f2937',
        overflow: 'hidden',
    },
    emptyContainer: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        color: '#e5e7eb',
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
