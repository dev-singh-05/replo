// ============================================================
// Replo — WorkoutTemplatesScreen
// Browse public workout templates with difficulty filter
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TemplateCard from '../components/TemplateCard';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import type { WorkoutDifficulty } from '../types';
import { WORKOUT_DIFFICULTIES } from '../types';

const DIFFICULTY_COLORS: Record<WorkoutDifficulty, string> = {
    beginner: '#10b981',
    intermediate: '#3b82f6',
    advanced: '#f59e0b',
    expert: '#ef4444',
};

export default function WorkoutTemplatesScreen() {
    const router = useRouter();
    const { templates, isLoading, error, refetch, difficulty, setDifficultyFilter } = useWorkoutTemplates();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Workout Plans</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Difficulty Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                <TouchableOpacity
                    style={[styles.filterChip, !difficulty && styles.filterChipActive]}
                    onPress={() => setDifficultyFilter(undefined)}
                >
                    <Text style={[styles.filterText, !difficulty && styles.filterTextActive]}>All</Text>
                </TouchableOpacity>
                {WORKOUT_DIFFICULTIES.map((d) => (
                    <TouchableOpacity
                        key={d.value}
                        style={[
                            styles.filterChip,
                            difficulty === d.value && {
                                backgroundColor: DIFFICULTY_COLORS[d.value] + '1A',
                                borderColor: DIFFICULTY_COLORS[d.value],
                            },
                        ]}
                        onPress={() => setDifficultyFilter(difficulty === d.value ? undefined : d.value)}
                    >
                        <Text style={[
                            styles.filterText,
                            difficulty === d.value && { color: DIFFICULTY_COLORS[d.value] },
                        ]}>
                            {d.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />
                }
            >
                {isLoading && templates.length === 0 && (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#10b981" />
                    </View>
                )}

                {error && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error.message}</Text>
                    </View>
                )}

                {!isLoading && templates.length === 0 && !error && (
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={48} color="#374151" />
                        <Text style={styles.emptyTitle}>No Workout Plans</Text>
                        <Text style={styles.emptyHint}>
                            {difficulty ? `No ${difficulty} workouts found` : 'Check back later'}
                        </Text>
                    </View>
                )}

                {templates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        name={template.name}
                        description={template.description}
                        badge={template.difficulty}
                        badgeColor={DIFFICULTY_COLORS[template.difficulty]}
                        items={template.exercises}
                        itemType="exercise"
                        meta={template.duration_mins ? `${template.duration_mins} min` : undefined}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
    },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },

    filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    filterChipActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: '#10b981',
    },
    filterText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
    filterTextActive: { color: '#10b981', fontWeight: '600' },

    content: { paddingHorizontal: 16, paddingBottom: 24 },
    center: { paddingTop: 60, alignItems: 'center' },
    errorCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#4b5563', marginTop: 4 },
});
