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

export default function CreateGymScreen() {
    const router = useRouter();
    const { createGym, signOut, isLoading, error, profile } = useAuth();

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('+91 ');
    const [localError, setLocalError] = useState<string | null>(null);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setName(value);
        setSlug(
            value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
        );
    };

    const handleCreate = async () => {
        setLocalError(null);

        if (!name.trim()) {
            setLocalError('Gym name is required');
            return;
        }
        if (!slug.trim()) {
            setLocalError('Slug is required');
            return;
        }
        if (!/^[a-z0-9-]+$/.test(slug)) {
            setLocalError('Slug must be lowercase letters, numbers, and hyphens only');
            return;
        }

        try {
            await createGym({
                name: name.trim(),
                slug: slug.trim(),
                city: city.trim() || undefined,
                phone: phone.replace(/\s+/g, '') || undefined,
            });
            // After gym creation, navigate to root which will route to owner stack
            router.replace('/');
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
                    <Text style={styles.greeting}>
                        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
                    </Text>
                    <Text style={styles.subtitle}>
                        Set up your gym to get started
                    </Text>
                </View>

                <View style={styles.form}>
                    {displayError && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{displayError}</Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gym Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={handleNameChange}
                            placeholder="Iron Temple Fitness"
                            placeholderTextColor="#6b7280"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Slug (URL identifier)</Text>
                        <TextInput
                            style={styles.input}
                            value={slug}
                            onChangeText={setSlug}
                            placeholder="iron-temple-fitness"
                            placeholderTextColor="#6b7280"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.hint}>
                            Must be unique. Lowercase, numbers, hyphens only.
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="Mumbai"
                            placeholderTextColor="#6b7280"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+91 9876543210"
                            placeholderTextColor="#6b7280"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleCreate}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Gym</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={signOut}
                    >
                        <Text style={styles.signOutText}>Sign Out</Text>
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
        marginBottom: 36,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f9fafb',
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 8,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
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
    hint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
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
    signOutButton: {
        marginTop: 24,
        alignItems: 'center',
        paddingVertical: 12,
    },
    signOutText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
});
