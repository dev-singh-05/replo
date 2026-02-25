// ============================================================
// Replo — FeedbackScreen
// Submit feedback + view past submissions
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
    Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import RatingSelector from '../components/RatingSelector';
import StatusBadge from '../components/StatusBadge';
import { useFeedback } from '../hooks/useFeedback';
import type { FeedbackCategory } from '../types';
import { FEEDBACK_CATEGORIES } from '../types';

export default function FeedbackScreen() {
    const router = useRouter();
    const { feedbackHistory, isLoading, error, refetch, submitFeedback } = useFeedback();

    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState<FeedbackCategory>('general');
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [showForm, setShowForm] = useState(true);

    const handleSubmit = async () => {
        if (rating === 0) { Alert.alert('Missing Rating', 'Please select a rating.'); return; }
        try {
            await submitFeedback.mutate({ category, rating, comment: comment.trim() || undefined, is_anonymous: isAnonymous });
            Alert.alert('Thank You!', 'Your feedback has been submitted.');
            setRating(0); setComment(''); setIsAnonymous(false);
            refetch();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not submit feedback.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#f9fafb" />
                </TouchableOpacity>
                <Text style={styles.title}>Feedback</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Tab Toggle */}
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, showForm && styles.tabActive]} onPress={() => setShowForm(true)}>
                    <Text style={[styles.tabText, showForm && styles.tabTextActive]}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, !showForm && styles.tabActive]} onPress={() => setShowForm(false)}>
                    <Text style={[styles.tabText, !showForm && styles.tabTextActive]}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />}>

                {showForm ? (
                    <View>
                        <RatingSelector rating={rating} onSelect={setRating} />

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.catGrid}>
                            {FEEDBACK_CATEGORIES.map((c) => (
                                <TouchableOpacity key={c.value}
                                    style={[styles.catChip, category === c.value && styles.catChipActive]}
                                    onPress={() => setCategory(c.value)}>
                                    <Text style={[styles.catText, category === c.value && styles.catTextActive]}>{c.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Comment (optional)</Text>
                        <TextInput style={styles.textArea} value={comment} onChangeText={setComment}
                            placeholder="Share your experience..." placeholderTextColor="#4b5563"
                            multiline numberOfLines={4} maxLength={500} textAlignVertical="top" />
                        <Text style={styles.charCount}>{comment.length}/500</Text>

                        <View style={styles.anonRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.anonLabel}>Submit Anonymously</Text>
                                <Text style={styles.anonHint}>Your name won't be shown to staff</Text>
                            </View>
                            <Switch value={isAnonymous} onValueChange={setIsAnonymous}
                                trackColor={{ false: '#374151', true: 'rgba(99,102,241,0.4)' }}
                                thumbColor={isAnonymous ? '#6366f1' : '#6b7280'} />
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, (submitFeedback.isLoading || rating === 0) && styles.submitBtnDisabled]}
                            onPress={handleSubmit} disabled={submitFeedback.isLoading || rating === 0} activeOpacity={0.7}>
                            {submitFeedback.isLoading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.submitText}>Submit Feedback</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {error && <View style={styles.errorCard}><Text style={styles.errorText}>{error.message}</Text></View>}
                        {isLoading && feedbackHistory.length === 0 && <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />}
                        {!isLoading && feedbackHistory.length === 0 && !error && (
                            <View style={styles.empty}>
                                <Ionicons name="chatbubble-outline" size={48} color="#374151" />
                                <Text style={styles.emptyTitle}>No Feedback Yet</Text>
                                <Text style={styles.emptyHint}>Your submitted feedback will appear here</Text>
                            </View>
                        )}
                        {feedbackHistory.map((fb) => (
                            <View key={fb.id} style={styles.historyCard}>
                                <View style={styles.historyTop}>
                                    <View style={styles.starsSmall}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons key={s} name={s <= fb.rating ? 'star' : 'star-outline'}
                                                size={14} color={s <= fb.rating ? '#f59e0b' : '#374151'} />
                                        ))}
                                    </View>
                                    <StatusBadge status={fb.status} />
                                </View>
                                <Text style={styles.historyCat}>{fb.category.toUpperCase()}</Text>
                                {fb.comment && <Text style={styles.historyComment}>{fb.comment}</Text>}
                                <View style={styles.historyMeta}>
                                    {fb.is_anonymous && <Text style={styles.anonBadge}>Anonymous</Text>}
                                    <Text style={styles.historyDate}>
                                        {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111827', borderRadius: 10, padding: 3 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: '#1f2937' },
    tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
    tabTextActive: { color: '#f9fafb', fontWeight: '600' },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
    label: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8, marginTop: 4, letterSpacing: 0.3 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
    catChipActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf6' },
    catText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
    catTextActive: { color: '#8b5cf6', fontWeight: '600' },
    textArea: { backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#1f2937', padding: 12, fontSize: 14, color: '#f9fafb', minHeight: 100 },
    charCount: { fontSize: 11, color: '#4b5563', textAlign: 'right', marginTop: 4, marginBottom: 12 },
    anonRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1f2937' },
    anonLabel: { fontSize: 14, fontWeight: '600', color: '#e5e7eb' },
    anonHint: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    submitBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.5 },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    errorCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#4b5563', marginTop: 4 },
    historyCard: { backgroundColor: '#111827', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
    historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    starsSmall: { flexDirection: 'row', gap: 2 },
    historyCat: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 4 },
    historyComment: { fontSize: 13, color: '#d1d5db', lineHeight: 18, marginBottom: 6 },
    historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    anonBadge: { fontSize: 10, fontWeight: '600', color: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    historyDate: { fontSize: 11, color: '#4b5563' },
});
