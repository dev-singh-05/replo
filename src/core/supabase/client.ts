// ============================================================
// Replo — Supabase Client (Singleton)
// SSR-safe: guards against server-side rendering where
// `window` is not defined.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Only import the URL polyfill on native platforms
if (Platform.OS !== 'web') {
    require('react-native-url-polyfill/auto');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add them to your .env file.'
    );
}

export const supabase: SupabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        ...(typeof window !== 'undefined' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: typeof window !== 'undefined',
        detectSessionInUrl: false,
    },
});

