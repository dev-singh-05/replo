import { useAuth } from '@/src/core/hooks/use-auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { updateProfileDetails, completeOnboardingStep, profile } = useAuth();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [ageText, setAgeText] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | null>(profile?.gender || null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            setError('Please enter your full name');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await updateProfileDetails({
                full_name: fullName.trim(),
                gender: gender,
                // store age in date_of_birth roughly if needed, for now we will just use gender
            });
            await completeOnboardingStep('profile');
            // Router dispatcher handles redirect to next step (join/create gym)
            router.replace('/');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>Complete Profile</Text>
                    <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
                </View>

                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="John Doe"
                            placeholderTextColor="#6b7280"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.chipRow}>
                            {['male', 'female', 'other'].map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.chip, gender === opt && styles.chipActive]}
                                    onPress={() => setGender(opt as any)}
                                >
                                    <Text style={[styles.chipText, gender === opt && styles.chipTextActive]}>
                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
    header: { marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', color: '#f9fafb', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#9ca3af' },
    errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
    form: { gap: 16 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '500', color: '#d1d5db' },
    input: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', borderRadius: 10, padding: 16, color: '#f9fafb', fontSize: 16 },
    chipRow: { flexDirection: 'row', gap: 12 },
    chip: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    chipActive: { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1' },
    chipText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
    chipTextActive: { color: '#6366f1', fontWeight: '700' },
    button: { backgroundColor: '#6366f1', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
