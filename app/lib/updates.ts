import { SITE_URL } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Updates for the APK people download from the website (no Play Store to do it for them).
 * The site publishes /download/latest.json; when it names a newer version than this build,
 * home offers the download. A version you dismiss isn't offered again.
 */

export type Release = { version: string; url: string; notes?: string };

const DISMISSED_KEY = 'chalo:update-dismissed';

/** -1, 0 or 1, comparing dotted numeric versions ("1.10.0" > "1.9.2"). */
export function compareVersions(a: string, b: string) {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

export async function checkForUpdate(): Promise<Release | null> {
  const current = Constants.expoConfig?.version;
  if (Platform.OS !== 'android' || __DEV__ || !SITE_URL || !current) return null;
  try {
    const res = await fetch(`${SITE_URL}/download/latest.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    const latest = (await res.json()) as Release;
    if (!latest?.version || !latest.url || compareVersions(latest.version, current) <= 0) return null;
    if ((await AsyncStorage.getItem(DISMISSED_KEY)) === latest.version) return null;
    return latest;
  } catch {
    return null;
  }
}

export function dismissUpdate(version: string) {
  return AsyncStorage.setItem(DISMISSED_KEY, version).catch(() => {});
}
