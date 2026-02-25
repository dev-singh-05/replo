import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth-store';

// Prevent splash screen from auto-hiding until hydration completes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const initialize = useAuthStore((s) => s.initialize);

  // Boot: restore session + resolve tenant
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Hide splash screen once hydrated
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  // Don't render any routes until hydration completes
  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(owner)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="(member)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
