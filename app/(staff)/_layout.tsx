import { useProtectedRoute } from '@/src/core/hooks/use-protected-route';
import { Stack } from 'expo-router';

export default function StaffLayout() {
    useProtectedRoute(['owner', 'manager', 'trainer', 'receptionist']);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="member-list" />
            <Stack.Screen name="member-detail" />
            <Stack.Screen name="create-member" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="equipment-reports" />
        </Stack>
    );
}
