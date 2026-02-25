// ============================================================
// Replo — TemplateCard Component
// Expandable card for workout/diet templates with JSON rendering
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DietMeal, WorkoutExercise } from '../types';

interface TemplateCardProps {
    name: string;
    description: string | null;
    badge: string;
    badgeColor: string;
    items: WorkoutExercise[] | DietMeal[];
    itemType: 'exercise' | 'meal';
    meta?: string;
}

export default function TemplateCard({
    name,
    description,
    badge,
    badgeColor,
    items,
    itemType,
    meta,
}: TemplateCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <Text style={styles.name}>{name}</Text>
                    {description && (
                        <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
                            {description}
                        </Text>
                    )}
                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: badgeColor + '1A' }]}>
                            <Text style={[styles.badgeText, { color: badgeColor }]}>
                                {badge.replace(/_/g, ' ').toUpperCase()}
                            </Text>
                        </View>
                        {meta && <Text style={styles.meta}>{meta}</Text>}
                        <Text style={styles.itemCount}>
                            {items.length} {itemType}{items.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                />
            </TouchableOpacity>

            {expanded && items.length > 0 && (
                <View style={styles.itemsList}>
                    {items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemIndex}>
                                <Text style={styles.itemIndexText}>{index + 1}</Text>
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {itemType === 'exercise' && renderExerciseDetails(item as WorkoutExercise)}
                                {itemType === 'meal' && renderMealDetails(item as DietMeal)}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {expanded && items.length === 0 && (
                <Text style={styles.emptyItems}>No {itemType}s listed</Text>
            )}
        </View>
    );
}

function renderExerciseDetails(ex: WorkoutExercise) {
    const parts: string[] = [];
    if (ex.sets) parts.push(`${ex.sets} sets`);
    if (ex.reps) parts.push(`${ex.reps} reps`);
    if (ex.duration) parts.push(ex.duration);
    if (ex.rest) parts.push(`Rest: ${ex.rest}`);

    return (
        <View>
            {parts.length > 0 && <Text style={styles.itemDetail}>{parts.join(' • ')}</Text>}
            {ex.notes && <Text style={styles.itemNotes}>{ex.notes}</Text>}
        </View>
    );
}

function renderMealDetails(meal: DietMeal) {
    const macros: string[] = [];
    if (meal.calories) macros.push(`${meal.calories} kcal`);
    if (meal.protein) macros.push(`P: ${meal.protein}`);
    if (meal.carbs) macros.push(`C: ${meal.carbs}`);
    if (meal.fats) macros.push(`F: ${meal.fats}`);

    return (
        <View>
            {meal.time && <Text style={styles.itemDetail}>{meal.time}</Text>}
            {meal.items && meal.items.length > 0 && (
                <Text style={styles.itemDetail}>{meal.items.join(', ')}</Text>
            )}
            {macros.length > 0 && <Text style={styles.itemMacros}>{macros.join(' • ')}</Text>}
            {meal.notes && <Text style={styles.itemNotes}>{meal.notes}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1f2937',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    headerLeft: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f9fafb',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#9ca3af',
        marginBottom: 8,
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    meta: {
        fontSize: 12,
        color: '#6b7280',
    },
    itemCount: {
        fontSize: 12,
        color: '#6b7280',
    },
    itemsList: {
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(31, 41, 55, 0.5)',
    },
    itemIndex: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    itemIndexText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6366f1',
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 2,
    },
    itemDetail: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    itemMacros: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '500',
        marginTop: 3,
    },
    itemNotes: {
        fontSize: 11,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 3,
    },
    emptyItems: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
});
