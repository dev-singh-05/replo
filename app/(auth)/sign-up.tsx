import { useAuth } from '@/src/core/hooks/use-auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp, isLoading, error } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('+91 ');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSignUp = async () => {
        setLocalError(null);
        setSuccessMessage(null);

        if (!fullName.trim()) {
            setLocalError('Full name is required');
            return;
        }
        if (!email.trim()) {
            setLocalError('Email is required');
            return;
        }
        if (!phone.trim()) {
            setLocalError('Phone number is required');
            return;
        }
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            await signUp(email.trim(), password, fullName.trim(), phone.replace(/\s+/g, ''));
            // If we get here without throwing, sign-up succeeded.
            // Show confirmation message — user needs to verify email.
            setSuccessMessage(
                'Account created! Check your email for a confirmation link, then sign in.'
            );
        } catch (err) {
            if (err instanceof Error) {
                setLocalError(err.message);
            }
        }
    };

    const displayError = localError || error;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>REPLO</Text>
                    <Text style={styles.subtitle}>Create Your Account</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>Sign Up</Text>

                    {successMessage && (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>{successMessage}</Text>
                            <TouchableOpacity
                                style={styles.goSignInBtn}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.goSignInText}>Go to Sign In →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {displayError && !successMessage && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{displayError}</Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="John Doe"
                            placeholderTextColor="#6b7280"
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor="#6b7280"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor="#6b7280"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min. 8 characters"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Repeat password"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => router.back()}
                        disabled={isLoading}
                    >
                        <Text style={styles.linkText}>
                            Already have an account?{' '}
                            <Text style={styles.linkTextBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 36,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f9fafb',
        marginBottom: 24,
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    successText: {
        color: '#22c55e',
        fontSize: 14,
        lineHeight: 20,
    },
    goSignInBtn: {
        marginTop: 12,
        backgroundColor: '#22c55e',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center' as const,
    },
    goSignInText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600' as const,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#d1d5db',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#f9fafb',
    },
    button: {
        backgroundColor: '#6366f1',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    linkTextBold: {
        color: '#6366f1',
        fontWeight: '600',
    },
});
