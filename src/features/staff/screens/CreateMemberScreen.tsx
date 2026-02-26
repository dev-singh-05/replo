import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity, View
} from 'react-native';
import { FormInput } from '../components/FormInput';
import { useMembers } from '../hooks/useMembers';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateMemberScreen() {
    const router = useRouter();
    const { createMember } = useMembers();

    const [phone, setPhone] = useState('+91 ');
    const [name, setName] = useState('');
    const [membershipNumber, setMembershipNumber] = useState('');
    const [joinedAt, setJoinedAt] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [planType, setPlanType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
    const [initialPaymentStatus, setInitialPaymentStatus] = useState<'paid' | 'unpaid'>('paid');

    // Date picker state
    const [showJoinedPicker, setShowJoinedPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Calculate next renewal date for preview
    const getNextRenewalDate = () => {
        if (!startDate) return null;
        const nextDate = new Date(startDate);
        if (planType === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (planType === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
        else if (planType === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        return nextDate;
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!phone.trim()) e.phone = 'Phone number is required';
        if (!name.trim()) e.name = 'Name is required';
        if (!startDate) e.startDate = 'Required';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createMember.mutate({
                phone: phone.replace(/\s+/g, ''),
                name: name.trim(),
                membership_number: membershipNumber.trim() || undefined,
                joined_at: joinedAt ? joinedAt.toISOString() : undefined,
                start_date: startDate.toISOString().split('T')[0],
                plan_type: planType,
                initial_payment_status: initialPaymentStatus
            });
            Alert.alert('Success', 'Member, contract & billing cycle created successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create member');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#9ca3af" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Add New Member</Text>

                <FormInput
                    label="Mobile Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 9876543210"
                    error={errors.phone}
                    keyboardType="phone-pad"
                />

                <FormInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. John Doe"
                    error={errors.name}
                />

                <FormInput
                    label="Membership Number (optional)"
                    value={membershipNumber}
                    onChangeText={setMembershipNumber}
                    placeholder="e.g. GYM-001"
                />

                <View style={[styles.dateField, { marginBottom: 16 }]}>
                    <Text style={styles.label}>Joined Gym Date <Text style={styles.optional}>(Optional)</Text></Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowJoinedPicker(true)}
                    >
                        <Text style={[styles.dateButtonText, !joinedAt && styles.dateButtonPlaceholder]}>
                            {joinedAt ? joinedAt.toLocaleDateString() : 'Select date'}
                        </Text>
                    </TouchableOpacity>
                    {joinedAt && (
                        <TouchableOpacity onPress={() => setJoinedAt(null)}>
                            <Text style={styles.clearDateText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                    {showJoinedPicker && (
                        <DateTimePicker
                            value={joinedAt || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowJoinedPicker(Platform.OS === 'ios');
                                if (date) setJoinedAt(date);
                            }}
                        />
                    )}
                </View>

                <Text style={styles.sectionTitle}>Membership Configuration</Text>

                <View style={styles.dateField}>
                    <Text style={styles.label}>Billing Start Date (e.g. Last Payment Day)</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, errors.startDate && { borderColor: '#ef4444' }]}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {startDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowStartPicker(Platform.OS === 'ios');
                                if (date) setStartDate(date);
                            }}
                        />
                    )}
                    {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}
                </View>

                <Text style={styles.label}>Plan Timeline</Text>
                <View style={styles.planContainer}>
                    {['monthly', 'quarterly', 'yearly'].map((plan) => (
                        <TouchableOpacity
                            key={plan}
                            style={[styles.planBtn, planType === plan && styles.planBtnActive]}
                            onPress={() => setPlanType(plan as any)}
                        >
                            <Text style={[styles.planText, planType === plan && styles.planTextActive]}>
                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {planType !== 'custom' && (
                    <View style={styles.previewBox}>
                        <Text style={styles.previewLabel}>Next Renewal Date:</Text>
                        <Text style={styles.previewDate}>{getNextRenewalDate()?.toLocaleDateString()}</Text>
                    </View>
                )}

                <Text style={styles.label}>Initial Payment Status (For Current Cycle)</Text>
                <View style={styles.planContainer}>
                    {['paid', 'unpaid'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.planBtn, initialPaymentStatus === status && styles.planBtnActive]}
                            onPress={() => setInitialPaymentStatus(status as any)}
                        >
                            <Text style={[styles.planText, initialPaymentStatus === status && styles.planTextActive]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, createMember.isLoading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={createMember.isLoading}
                >
                    {createMember.isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Create Member & Contract</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 40 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backText: { color: '#9ca3af', fontSize: 15 },
    title: { fontSize: 24, fontWeight: '700', color: '#f9fafb', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f9fafb', marginTop: 12, marginBottom: 16 },
    label: { color: '#d1d5db', fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 4 },
    planContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    planBtn: {
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
        backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151'
    },
    planBtnActive: {
        backgroundColor: '#4f46e5', borderColor: '#6366f1'
    },
    planText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
    planTextActive: { color: '#ffffff' },
    datePickerContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    dateField: { flex: 1 },
    dateButton: {
        backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
        borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14,
    },
    dateButtonText: { color: '#f9fafb', fontSize: 16 },
    dateButtonPlaceholder: { color: '#6b7280' },
    clearDateText: { color: '#ef4444', fontSize: 12, marginTop: 6, alignSelf: 'flex-end' },
    previewBox: { backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)', marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    previewLabel: { color: '#d1d5db', fontSize: 14, fontWeight: '500' },
    previewDate: { color: '#6366f1', fontSize: 16, fontWeight: '600' },
    optional: { color: '#6b7280', fontSize: 12, fontWeight: '400' },
    errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
    submitBtn: {
        backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 16,
        alignItems: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
