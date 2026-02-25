// ============================================================
// Replo — RatingSelector Component
// 1–5 star rating input with touch targets
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RatingSelectorProps {
    rating: number;
    onSelect: (value: number) => void;
    size?: number;
    label?: string;
}

export default function RatingSelector({
    rating,
    onSelect,
    size = 32,
    label = 'Rating',
}: RatingSelectorProps) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => onSelect(star)}
                        activeOpacity={0.6}
                        style={styles.starTouch}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= rating ? '#f59e0b' : '#374151'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            {rating > 0 && (
                <Text style={styles.ratingText}>
                    {rating}/5 — {getRatingLabel(rating)}
                </Text>
            )}
        </View>
    );
}

function getRatingLabel(rating: number): string {
    switch (rating) {
        case 1: return 'Poor';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Very Good';
        case 5: return 'Excellent';
        default: return '';
    }
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    starTouch: {
        padding: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#f59e0b',
        marginTop: 6,
        fontWeight: '500',
    },
});
