import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useIncomingRequests } from '../hooks/useIncomingRequests';
import { useMembers } from '../hooks/useMembers';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateMemberScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        requestId?: string;
        userId?: string;
        name?: string;
        phone?: string;
    }>();
    const isFromRequest = !!params.requestId;

    const { createMember, sendGymRequest } = useMembers();
    const { markApproved } = useIncomingRequests();

    const [phone, setPhone] = useState(params.phone || '+91 ');
    const [name, setName] = useState(params.name || '');
    const [membershipNumber, setMembershipNumber] = useState('');
    const [joinedAt, setJoinedAt] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [planType, setPlanType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
    const [initialPaymentStatus, setInitialPaymentStatus] = useState<'paid' | 'unpaid'>('paid');

    // Date picker state
    const [showJoinedPicker, setShowJoinedPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Conflict handling state
    const [conflictMessage, setConflictMessage] = useState<string | null>(null);
    const [showCrossGymDialog, setShowCrossGymDialog] = useState(false);
    const [crossGymUserId, setCrossGymUserId] = useState<string | null>(null);
    const [crossGymUserName, setCrossGymUserName] = useState<string | null>(null);
    const [requestSent, setRequestSent] = useState(false);

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

        // Clear previous conflict state
        setConflictMessage(null);
        setShowCrossGymDialog(false);
        setRequestSent(false);

        try {
            const result = await createMember.mutate({
                phone: phone.replace(/\s+/g, ''),
                name: name.trim(),
                membership_number: membershipNumber.trim() || undefined,
                joined_at: joinedAt ? joinedAt.toISOString() : undefined,
                start_date: startDate.toISOString().split('T')[0],
                plan_type: planType,
                initial_payment_status: initialPaymentStatus
            });

            if (!result) return;

            switch (result.status) {
                case 'created':
                    // If from a request, mark it as approved
                    if (isFromRequest && params.requestId) {
                        await markApproved(params.requestId);
                    }
                    if (Platform.OS === 'web') {
                        window.alert('Member, contract & billing cycle created successfully!');
                        router.back();
                    } else {
                        Alert.alert('Success', 'Member, contract & billing cycle created successfully!', [
                            { text: 'OK', onPress: () => router.back() },
                        ]);
                    }
                    break;

                case 'conflict_same_gym':
                    setConflictMessage(result.message);
                    break;

                case 'conflict_other_gym':
                    setCrossGymUserId(result.targetUserId || null);
                    setCrossGymUserName(result.targetUserName || null);
                    if (result.hasPendingRequest) {
                        setConflictMessage('A registration request is already pending for this member.');
                    } else {
                        setShowCrossGymDialog(true);
                    }
                    break;

                case 'error':
                    setConflictMessage(result.message);
                    break;
            }
        } catch (err: any) {
            setConflictMessage(err.message || 'Failed to create member. Please try again.');
        }
    };

    const handleSendRequest = async () => {
        if (!crossGymUserId) return;
        try {
            const result = await sendGymRequest.mutate(crossGymUserId);
            setRequestSent(true);
            setShowCrossGymDialog(false);
            if (result?.alreadySent) {
                setConflictMessage('A registration request was already sent to this member.');
            } else {
                setConflictMessage('Registration request sent! The member will need to approve it.');
            }
        } catch (err: any) {
            setConflictMessage(err.message || 'Failed to send request. Please try again.');
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

                <Text style={styles.title}>
                    {isFromRequest ? 'Accept Join Request' : 'Add New Member'}
                </Text>

                {/* Pre-filled from request banner */}
                {isFromRequest && (
                    <View style={[styles.conflictBox, styles.conflictBoxInfo]}>
                        <Ionicons name="person-add" size={20} color="#22c55e" />
                        <Text style={[styles.conflictText, styles.conflictTextInfo]}>
                            {params.name}'s details are pre-filled. Just set the subscription details below.
                        </Text>
                    </View>
                )}

                {/* Conflict message banner */}
                {conflictMessage && (
                    <View style={[styles.conflictBox, requestSent && styles.conflictBoxInfo]}>
                        <Ionicons
                            name={requestSent ? 'checkmark-circle' : 'warning'}
                            size={20}
                            color={requestSent ? '#22c55e' : '#f59e0b'}
                        />
                        <Text style={[styles.conflictText, requestSent && styles.conflictTextInfo]}>
                            {conflictMessage}
                        </Text>
                    </View>
                )}

                {/* Cross-gym dialog */}
                {showCrossGymDialog && (
                    <View style={styles.crossGymDialog}>
                        <Ionicons name="people" size={24} color="#6366f1" />
                        <Text style={styles.crossGymTitle}>Member at Another Gym</Text>
                        <Text style={styles.crossGymMessage}>
                            {crossGymUserName
                                ? `"${crossGymUserName}" is registered with another gym.`
                                : 'This mobile number is registered with another gym.'}
                        </Text>
                        <Text style={styles.crossGymSubtext}>
                            Send a registration request. The member must approve before being added to your gym.
                        </Text>
                        <TouchableOpacity
                            style={styles.requestBtn}
                            onPress={handleSendRequest}
                            disabled={sendGymRequest.isLoading}
                        >
                            {sendGymRequest.isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.requestBtnText}>Send Registration Request</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowCrossGymDialog(false)}>
                            <Text style={styles.crossGymCancel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FormInput
                    label="Mobile Number"
                    value={phone}
                    onChangeText={(text) => {
                        setPhone(text);
                        setConflictMessage(null);
                        setShowCrossGymDialog(false);
                        setRequestSent(false);
                    }}
                    placeholder="+91 9876543210"
                    error={errors.phone}
                    keyboardType="phone-pad"
                    editable={!isFromRequest}
                    style={isFromRequest ? { opacity: 0.6 } : undefined}
                    hint={isFromRequest ? 'Set by user — cannot be changed' : undefined}
                />

                <FormInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. John Doe"
                    error={errors.name}
                    editable={!isFromRequest}
                    style={isFromRequest ? { opacity: 0.6 } : undefined}
                    hint={isFromRequest ? 'Set by user — cannot be changed' : undefined}
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
    // Conflict handling styles
    conflictBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: 10,
        padding: 14, marginBottom: 16,
    },
    conflictBoxInfo: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    conflictText: { color: '#f59e0b', fontSize: 14, flex: 1, lineHeight: 20 },
    conflictTextInfo: { color: '#22c55e' },
    crossGymDialog: {
        backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151',
        borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center',
    },
    crossGymTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 8 },
    crossGymMessage: { color: '#d1d5db', fontSize: 14, textAlign: 'center', marginBottom: 4 },
    crossGymSubtext: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginBottom: 16 },
    requestBtn: {
        backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 14,
        paddingHorizontal: 24, alignItems: 'center', width: '100%', marginBottom: 8,
    },
    requestBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    crossGymCancel: { color: '#9ca3af', fontSize: 14, marginTop: 4 },
});
