// ============================================================
// Replo — Gym Selection Screen (Pre-Login)
// Users select a gym before signing in
// ============================================================

import { supabase } from '@/src/core/supabase/client';
import { useAuthStore } from '@/src/store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GymListItem {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
}

export default function GymSelectionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const setSelectedGymId = useAuthStore((s) => s.setSelectedGymId);

    const [gyms, setGyms] = useState<GymListItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase
                .from('gyms')
                .select('id, name, city, country')
                .eq('is_active', true)
                .order('name');
            if (fetchErr) throw fetchErr;
            setGyms(data ?? []);
        } catch (err: any) {
            setError(err.message || 'Failed to load gyms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectGym = (gymId: string) => {
        setSelectedGymId(gymId);
        router.replace('/(auth)/sign-in' as Href);
    };

    const handleSkip = () => {
        setSelectedGymId(null);
        router.replace('/(auth)/sign-in' as Href);
    };

    const filteredGyms = gyms.filter(
        (g) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (g.city && g.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 50) }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <Text style={styles.logo}>REPLO</Text>
                </View>
                <Text style={styles.title}>Select Your Gym</Text>
                <Text style={styles.subtitle}>
                    Choose a gym to get started, or skip to browse the app.
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or city..."
                    placeholderTextColor="#6b7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading gyms...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle" size={32} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchGyms}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredGyms}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.gymCard}
                            activeOpacity={0.7}
                            onPress={() => handleSelectGym(item.id)}
                        >
                            <View style={styles.gymIcon}>
                                <Ionicons name="fitness" size={22} color="#6366f1" />
                            </View>
                            <View style={styles.gymInfo}>
                                <Text style={styles.gymName}>{item.name}</Text>
                                <Text style={styles.gymCity}>
                                    {item.city ? `${item.city}, ${item.country}` : item.country ?? ''}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#374151" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="search" size={32} color="#374151" />
                            <Text style={styles.emptyText}>No gyms found.</Text>
                        </View>
                    }
                />
            )}

            {/* Skip button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipText}>Continue without selecting a gym</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { paddingHorizontal: 24, marginBottom: 20 },
    logoRow: { marginBottom: 24 },
    logo: { fontSize: 28, fontWeight: '800', color: '#6366f1', letterSpacing: 3 },
    title: { fontSize: 26, fontWeight: '700', color: '#f9fafb', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#9ca3af', lineHeight: 22 },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#111827', borderRadius: 12,
        paddingHorizontal: 14, marginHorizontal: 24, marginBottom: 12,
        borderWidth: 1, borderColor: '#1f2937',
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, paddingVertical: 13, fontSize: 16, color: '#f9fafb' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 32 },
    loadingText: { color: '#6b7280', fontSize: 14 },
    errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
    retryBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
    retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    emptyText: { color: '#6b7280', fontSize: 15 },

    list: { paddingHorizontal: 24, paddingBottom: 100 },
    gymCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#111827', borderRadius: 14, padding: 16,
        marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
    },
    gymIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    gymInfo: { flex: 1 },
    gymName: { fontSize: 16, fontWeight: '600', color: '#f9fafb', marginBottom: 3 },
    gymCity: { fontSize: 13, color: '#9ca3af' },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingTop: 16, paddingHorizontal: 24,
        backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1f2937',
    },
    skipBtn: { alignItems: 'center', paddingVertical: 14 },
    skipText: { color: '#9ca3af', fontSize: 15, fontWeight: '500' },
});
