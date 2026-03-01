import { useAuth } from '@/src/core/hooks/use-auth';
import { supabase } from '@/src/core/supabase/client';
import type { Gym } from '@/src/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGymScreen() {
    const router = useRouter();
    const { user, updateProfileDetails, refreshProfile } = useAuth();
    const insets = useSafeAreaInsets();

    const [gyms, setGyms] = useState<Gym[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [requestedGyms, setRequestedGyms] = useState<Set<string>>(new Set());

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

    const handleJoin = async (gymId: string, gymName: string) => {
        if (!user) return;
        setIsJoining(true);
        try {
            // 1. Check if user already has a member record in this gym
            //    (owner/staff pre-registered them using their phone number)
            const { data: existing } = await supabase
                .from('members')
                .select('id')
                .eq('gym_id', gymId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existing) {
                // Already a member — just link profile and go
                await updateProfileDetails({ gym_id: gymId });
                await refreshProfile();
                router.replace('/');
                return;
            }

            // 2. Not pre-registered — send a membership request
            const { error: reqError } = await supabase
                .from('gym_membership_requests')
                .insert({
                    gym_id: gymId,
                    user_id: user.id,
                    requested_by: user.id,
                    status: 'pending',
                });

            // Ignore duplicate request (already pending)
            if (reqError && reqError.code !== '23505') throw reqError;

            setRequestedGyms((prev) => new Set(prev).add(gymId));

            const msg = reqError?.code === '23505'
                ? `You already have a pending request for ${gymName}.`
                : `Registration request sent to ${gymName}! The gym owner will review your request.`;

            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert('Request Sent', msg);
            }
        } catch (err: any) {
            const msg = err.message || 'Something went wrong';
            if (Platform.OS === 'web') {
                window.alert('Error: ' + msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
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
                            {requestedGyms.has(item.id) ? (
                                <View style={[styles.joinBtn, styles.requestedBtn]}>
                                    <Text style={styles.requestedBtnText}>Requested ✓</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.joinBtn}
                                    onPress={() => handleJoin(item.id, item.name)}
                                    disabled={isJoining}
                                >
                                    <Text style={styles.joinBtnText}>
                                        {isJoining ? '...' : 'Send Request'}
                                    </Text>
                                </TouchableOpacity>
                            )}
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
    requestedBtn: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
    requestedBtnText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
    emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 32 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 24, paddingHorizontal: 24, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1f2937', alignItems: 'center' },
    skipText: { color: '#9ca3af', fontSize: 15, fontWeight: '500' }
});
