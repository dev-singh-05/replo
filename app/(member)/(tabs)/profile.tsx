import { useAuth } from '@/src/core/hooks/use-auth';
import { StyleSheet, Text, View } from 'react-native';

export default function MemberProfileScreen() {
    const { profile } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.card}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{profile?.full_name ?? '—'}</Text>

                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{profile?.phone ?? '—'}</Text>

                <Text style={styles.label}>Gender</Text>
                <Text style={styles.value}>{profile?.gender ?? '—'}</Text>
            </View>
            <Text style={styles.hint}>Profile editing coming in Block 3</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f9fafb',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 1,
        marginTop: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#f9fafb',
    },
    hint: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 24,
    },
});
