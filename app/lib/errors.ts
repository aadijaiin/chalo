import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Crash and error reports, sent to the app_errors table through report_error(). No third-party
 * service: read them in the Supabase dashboard. Off in development, where the red box covers it.
 */

const seen = new Set<string>();

export function reportError(error: unknown, fatal = false) {
  if (__DEV__) return;
  const e = error instanceof Error ? error : new Error(String(error));
  // The same error repeating in a render loop is one report.
  const key = `${e.message}\n${e.stack?.split('\n')[1] ?? ''}`;
  if (seen.has(key)) return;
  seen.add(key);
  supabase
    .rpc('report_error', {
      message: e.message || e.name,
      stack: e.stack ?? null,
      fatal,
      platform: `${Platform.OS} ${Platform.Version}`,
      app_version: Constants.expoConfig?.version ?? null,
    })
    .then(
      () => {},
      () => {}
    );
}

let installed = false;

/** Reports uncaught JS errors, then lets React Native handle them as it normally would. */
export function installErrorReporting() {
  if (installed || __DEV__) return;
  installed = true;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, Boolean(isFatal));
    previous(error, isFatal);
  });
}
