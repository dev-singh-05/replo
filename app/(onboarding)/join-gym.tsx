import { useAuth } from '@/src/core/hooks/use-auth';
import { supabase } from '@/src/core/supabase/client';
import type { Gym } from '@/src/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGymScreen() {
    const router = useRouter();
    const { user, updateProfileDetails, refreshProfile } = useAuth();
    const insets = useSafeAreaInsets();

    const [gyms, setGyms] = useState<Gym[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            const { data, error } = await supabase
                .from('gyms')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            setGyms(data as Gym[]);
        } catch (err: any) {
            Alert.alert('Error loading gyms', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (gymId: string) => {
        if (!user) return;
        setIsJoining(true);
        try {
            // 1. Insert into members table (creates relationship)
            const { error: memberError } = await supabase
                .from('members')
                .insert({
                    gym_id: gymId,
                    user_id: user.id,
                    status: 'active', // usually 'pending', but matching prompt simplify
                });

            if (memberError && memberError.code !== '23505') throw memberError; // ignore unique violation if already member

            // 2. Set gym_id on profile to clear onboarding flag
            await updateProfileDetails({ gym_id: gymId });

            // 3. Re-resolve tenant to pick up member role
            await refreshProfile();

            router.replace('/');
        } catch (err: any) {
            Alert.alert('Error joining gym', err.message || 'Check connection');
            setIsJoining(false);
        }
    };

    const handleSkip = async () => {
        setIsJoining(true);
        try {
            // We do not save a dummy gym_id because it violates the foreign key constraint.
            // If they skip, we just take them to the member dashboard. 
            // Note: Re-opening the app will prompt them again since they have no gym, which is desired.
            router.replace('/(member)/(tabs)');
        } catch (err: any) {
            Alert.alert('Error', err.message);
            setIsJoining(false);
        }
    };

    const filteredGyms = gyms.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.city && g.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Join a Gym</Text>
                <Text style={styles.subtitle}>Find your local Replo-powered gym.</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or city..."
                    placeholderTextColor="#6b7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <FlatList
                    data={filteredGyms}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.gymCard}>
                            <View style={styles.gymInfo}>
                                <Text style={styles.gymName}>{item.name}</Text>
                                <Text style={styles.gymCity}>
                                    {item.city ? `${item.city}, ${item.country}` : item.country}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.joinBtn}
                                onPress={() => handleJoin(item.id)}
                                disabled={isJoining}
                            >
                                <Text style={styles.joinBtnText}>Join</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No gyms found.</Text>
                    }
                />
            )}

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity onPress={handleSkip} disabled={isJoining}>
                    <Text style={styles.skipText}>Continue without joining</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 60 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#f9fafb', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#9ca3af' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1f2937' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingBottom: 100 },
    gymCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1f2937' },
    gymInfo: { flex: 1, paddingRight: 12 },
    gymName: { fontSize: 16, fontWeight: '700', color: '#f9fafb', marginBottom: 4 },
    gymCity: { fontSize: 13, color: '#9ca3af' },
    joinBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 32 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 24, paddingHorizontal: 24, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1f2937', alignItems: 'center' },
    skipText: { color: '#9ca3af', fontSize: 15, fontWeight: '500' }
});
