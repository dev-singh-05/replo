import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BarData {
    label: string;
    value: number;
}

interface Props {
    data: BarData[];
    color?: string;
    height?: number;
}

/**
 * Lightweight SVG-free bar chart using plain Views.
 * Works on all RN platforms without external libs.
 */
export function MiniBarChart({ data, color = '#6366f1', height = 100 }: Props) {
    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data yet</Text>
            </View>
        );
    }

    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <View style={[styles.container, { height: height + 32 }]}>
            <View style={[styles.barRow, { height }]}>
                {data.map((item, i) => {
                    const barHeight = (item.value / max) * height;
                    return (
                        <View key={i} style={styles.barGroup}>
                            <Text style={styles.barValue}>{item.value}</Text>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(barHeight, 2),
                                        backgroundColor: color,
                                        opacity: 0.3 + (item.value / max) * 0.7,
                                    },
                                ]}
                            />
                            <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    emptyContainer: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 13,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    barGroup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginHorizontal: 2,
    },
    bar: {
        width: '60%',
        borderRadius: 4,
        minWidth: 8,
    },
    barValue: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 4,
        fontWeight: '600',
    },
    barLabel: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 6,
    },
});
