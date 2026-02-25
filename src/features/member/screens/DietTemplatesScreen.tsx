// ============================================================
// Replo — DietTemplatesScreen
// Browse public diet templates with goal filter
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator, RefreshControl, ScrollView,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import TemplateCard from '../components/TemplateCard';
import { useDietTemplates } from '../hooks/useDietTemplates';
import type { DietGoal } from '../types';
import { DIET_GOALS } from '../types';

const GOAL_COLORS: Record<DietGoal, string> = {
    weight_loss: '#ef4444', muscle_gain: '#6366f1', maintenance: '#10b981',
    endurance: '#f59e0b', general_health: '#3b82f6',
};

export default function DietTemplatesScreen() {
    const router = useRouter();
    const { templates, isLoading, error, refetch, goal, setGoalFilter } = useDietTemplates();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Diet Plans</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <TouchableOpacity style={[styles.chip, !goal && styles.chipActive]} onPress={() => setGoalFilter(undefined)}>
                    <Text style={[styles.chipText, !goal && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {DIET_GOALS.map((g) => (
                    <TouchableOpacity key={g.value}
                        style={[styles.chip, goal === g.value && { backgroundColor: GOAL_COLORS[g.value] + '1A', borderColor: GOAL_COLORS[g.value] }]}
                        onPress={() => setGoalFilter(goal === g.value ? undefined : g.value)}>
                        <Text style={[styles.chipText, goal === g.value && { color: GOAL_COLORS[g.value] }]}>{g.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />}>
                {isLoading && templates.length === 0 && <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />}
                {error && <View style={styles.errorCard}><Text style={styles.errorText}>{error.message}</Text></View>}
                {!isLoading && templates.length === 0 && !error && (
                    <View style={styles.empty}>
                        <Ionicons name="nutrition-outline" size={48} color="#374151" />
                        <Text style={styles.emptyTitle}>No Diet Plans</Text>
                        <Text style={styles.emptyHint}>{goal ? `No ${goal.replace(/_/g, ' ')} plans` : 'Check back later'}</Text>
                    </View>
                )}
                {templates.map((t) => (
                    <TemplateCard key={t.id} name={t.name} description={t.description}
                        badge={t.goal} badgeColor={GOAL_COLORS[t.goal]} items={t.meals}
                        itemType="meal" meta={t.calories ? `${t.calories} kcal` : undefined} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
    filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
    chipActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' },
    chipText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
    chipTextActive: { color: '#f59e0b', fontWeight: '600' },
    content: { paddingHorizontal: 16, paddingBottom: 24 },
    errorCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#4b5563', marginTop: 4 },
});
