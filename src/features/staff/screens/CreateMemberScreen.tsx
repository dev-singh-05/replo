import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';
import { FormInput } from '../components/FormInput';
import { useMembers } from '../hooks/useMembers';

export default function CreateMemberScreen() {
    const router = useRouter();
    const { createMember } = useMembers();

    const [userId, setUserId] = useState('');
    const [membershipNumber, setMembershipNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [healthNotes, setHealthNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!userId.trim()) e.userId = 'User ID is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createMember.mutate({
                user_id: userId.trim(),
                membership_number: membershipNumber.trim() || undefined,
                emergency_contact: emergencyContact.trim() || undefined,
                health_notes: healthNotes.trim() || undefined,
            });
            Alert.alert('Success', 'Member created successfully', [
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
                    label="User ID (from auth)"
                    value={userId}
                    onChangeText={setUserId}
                    placeholder="UUID of authenticated user"
                    error={errors.userId}
                    autoCapitalize="none"
                />

                <FormInput
                    label="Membership Number (optional)"
                    value={membershipNumber}
                    onChangeText={setMembershipNumber}
                    placeholder="e.g. GYM-001"
                />

                <FormInput
                    label="Emergency Contact (optional)"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    placeholder="+91 9876543210"
                    keyboardType="phone-pad"
                />

                <FormInput
                    label="Health Notes (optional)"
                    value={healthNotes}
                    onChangeText={setHealthNotes}
                    placeholder="Any allergies, conditions..."
                    multiline
                />

                <TouchableOpacity
                    style={[styles.submitBtn, createMember.isLoading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={createMember.isLoading}
                >
                    {createMember.isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Create Member</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backText: { color: '#9ca3af', fontSize: 15 },
    title: { fontSize: 24, fontWeight: '700', color: '#f9fafb', marginBottom: 24 },
    submitBtn: {
        backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 16,
        alignItems: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
