import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && key);

/** The website (web/): invite links and the page password-reset emails open. */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? '';

// A placeholder URL keeps createClient from throwing before .env is filled in;
// screens check isSupabaseConfigured and explain what's missing instead.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/**
 * A Realtime channel name unique to this subscription. supabase-js hands back the existing
 * channel for a name that's already in use, so two screens for the same party (an invite link
 * or a notification opening a party that's already open) would share one, and adding listeners
 * to an already-subscribed channel throws.
 */
export function channelName(base: string) {
  return `${base}:${Math.random().toString(36).slice(2, 10)}`;
}
