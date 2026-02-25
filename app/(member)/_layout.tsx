import { useProtectedRoute } from '@/src/core/hooks/use-protected-route';
import { Stack } from 'expo-router';

export default function MemberLayout() {
    useProtectedRoute(['member']);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="workouts" />
            <Stack.Screen name="diets" />
            <Stack.Screen name="feedback" />
        </Stack>
    );
}
