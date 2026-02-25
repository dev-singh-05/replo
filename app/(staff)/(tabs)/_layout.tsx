import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function StaffTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#111827',
                    borderTopColor: '#1f2937',
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#6b7280',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="members"
                options={{
                    title: 'Members',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="log-in-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
