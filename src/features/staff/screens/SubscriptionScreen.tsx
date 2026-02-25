import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { FormInput } from '../components/FormInput';
import { StatusBadge } from '../components/StatusBadge';
import { useSubscriptions } from '../hooks/useSubscriptions';

export default function SubscriptionScreen() {
    const { memberId } = useLocalSearchParams<{ memberId: string }>();
    const router = useRouter();
    const {
        subscriptions, plans, createSubscription, cancelSubscription, pauseSubscription,
    } = useSubscriptions(memberId ?? null);

    const [showCreate, setShowCreate] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [amountPaid, setAmountPaid] = useState('');

    const selectedPlan = (plans.data ?? []).find((p) => p.id === selectedPlanId);

    const handleCreate = async () => {
        if (!selectedPlanId || !selectedPlan) {
            Alert.alert('Error', 'Please select a plan');
            return;
        }
        if (!amountPaid || isNaN(Number(amountPaid))) {
            Alert.alert('Error', 'Enter a valid amount');
            return;
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

        try {
            await createSubscription.mutate({
                member_id: memberId!,
                plan_id: selectedPlanId,
                start_date: startDate,
                end_date: endDate.toISOString().split('T')[0],
                amount_paid: Number(amountPaid),
            });
            Alert.alert('Success', 'Subscription created');
            setShowCreate(false);
            subscriptions.refetch();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create subscription');
        }
    };

    const handleCancel = (id: string) => {
        Alert.alert('Cancel Subscription', 'Are you sure?', [
            { text: 'No' },
            {
                text: 'Yes, Cancel', style: 'destructive',
                onPress: async () => {
                    try {
                        await cancelSubscription.mutate(id);
                        subscriptions.refetch();
                    } catch (err: any) {
                        Alert.alert('Error', err.message);
                    }
                },
            },
        ]);
    };

    const handlePause = (id: string) => {
        Alert.alert('Pause Subscription', 'Are you sure?', [
            { text: 'No' },
            {
                text: 'Yes, Pause',
                onPress: async () => {
                    try {
                        await pauseSubscription.mutate(id);
                        subscriptions.refetch();
                    } catch (err: any) {
                        Alert.alert('Error', err.message);
                    }
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#9ca3af" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerRow}>
                <Text style={styles.title}>Subscriptions</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
                    <Ionicons name={showCreate ? 'close' : 'add'} size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Create Form */}
            {showCreate && (
                <View style={styles.createForm}>
                    <Text style={styles.formTitle}>New Subscription</Text>

                    {/* Plan Picker */}
                    <Text style={styles.label}>Select Plan</Text>
                    <View style={styles.planGrid}>
                        {(plans.data ?? []).map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[styles.planChip, selectedPlanId === plan.id && styles.planChipActive]}
                                onPress={() => { setSelectedPlanId(plan.id); setAmountPaid(String(plan.price)); }}
                            >
                                <Text style={[styles.planName, selectedPlanId === plan.id && styles.planNameActive]}>
                                    {plan.name}
                                </Text>
                                <Text style={styles.planPrice}>₹{plan.price} · {plan.duration_days}d</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FormInput label="Start Date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
                    <FormInput label="Amount Paid (₹)" value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" />

                    <TouchableOpacity
                        style={[styles.submitBtn, createSubscription.isLoading && styles.btnDisabled]}
                        onPress={handleCreate}
                        disabled={createSubscription.isLoading}
                    >
                        {createSubscription.isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Create Subscription</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Subscription List */}
            {subscriptions.isLoading ? (
                <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
            ) : (subscriptions.data ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No subscriptions found</Text>
            ) : (
                (subscriptions.data ?? []).map((sub) => (
                    <View key={sub.id} style={styles.subCard}>
                        <View style={styles.subHeader}>
                            <Text style={styles.subPlan}>{sub.plans?.name ?? 'Plan'}</Text>
                            <StatusBadge status={sub.status} small />
                        </View>
                        <Text style={styles.subDates}>{sub.start_date} → {sub.end_date}</Text>
                        <Text style={styles.subAmount}>₹{sub.amount_paid}</Text>
                        {sub.status === 'active' ? (
                            <View style={styles.subActions}>
                                <TouchableOpacity style={styles.pauseBtn} onPress={() => handlePause(sub.id)}>
                                    <Text style={styles.pauseText}>Pause</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtnSm} onPress={() => handleCancel(sub.id)}>
                                    <Text style={styles.cancelTextSm}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                ))
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backText: { color: '#9ca3af', fontSize: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: '#f9fafb' },
    addBtn: { backgroundColor: '#6366f1', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    createForm: {
        backgroundColor: '#111827', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#1f2937', marginBottom: 20,
    },
    formTitle: { fontSize: 16, fontWeight: '600', color: '#e5e7eb', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#d1d5db', marginBottom: 6 },
    planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    planChip: {
        backgroundColor: '#1f2937', borderRadius: 8, padding: 10,
        borderWidth: 1, borderColor: '#374151', minWidth: '45%',
    },
    planChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' },
    planName: { fontSize: 13, fontWeight: '600', color: '#d1d5db' },
    planNameActive: { color: '#6366f1' },
    planPrice: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    submitBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    emptyText: { color: '#6b7280', fontSize: 13, marginTop: 20 },
    subCard: {
        backgroundColor: '#111827', borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: '#1f2937', marginBottom: 8,
    },
    subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    subPlan: { fontSize: 14, fontWeight: '600', color: '#e5e7eb' },
    subDates: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    subAmount: { fontSize: 14, fontWeight: '700', color: '#22c55e', marginTop: 4 },
    subActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    pauseBtn: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    pauseText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
    cancelBtnSm: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    cancelTextSm: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
});
