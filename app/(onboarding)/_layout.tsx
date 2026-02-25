import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="role-selection" />
            <Stack.Screen name="complete-profile" />
            <Stack.Screen name="create-gym" />
            <Stack.Screen name="join-gym" />
        </Stack>
    );
}
