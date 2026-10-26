import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/location';
import { parties, type Party } from '@/lib/parties';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as React from 'react';
import { AppState, Linking, Platform } from 'react-native';

/**
 * Location sharing for the one live party you're in.
 *
 * With "Allow all the time" granted, an OS-level location task (an Android
 * foreground service with a notification, an iOS background location session)
 * keeps posting your position even when the phone is locked. Without it we
 * fall back to posting from the foreground watcher while the app is open.
 */

const TASK = 'chalo-party-location';
const STORAGE_KEY = 'chalo.sharing';

type SharingTarget = Pick<Party, 'id' | 'name'>;

const HEARTBEAT_MS = 30_000;
const MIN_INTERVAL_MS = 2_000;

async function readTarget(): Promise<SharingTarget | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  return raw ? (JSON.parse(raw) as SharingTarget) : null;
}

async function stopTask() {
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK).catch(() => {});
  }
}

// Runs in the background (and foreground) whenever the OS delivers new fixes.
// Must be defined at module scope so it exists when the OS relaunches the JS.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const target = await readTarget();
  if (!target) return stopTask();
  const latest = data.locations[data.locations.length - 1];
  try {
    const stillLive = await parties.shareLocation(target.id, latest.coords);
    if (!stillLive) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await stopTask();
    }
  } catch (e) {
    // Offline or token refresh in flight; the next fix will try again.
    console.warn('[sharing] background post failed:', (e as Error).message);
  }
});

async function startTask(target: SharingTarget) {
  await stopTask();
  await Location.startLocationUpdatesAsync(TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
    activityType: Location.ActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: `Sharing your location · ${target.name}`,
      notificationBody: 'Your party can see you on the map. Leave the party in chalo to stop.',
      notificationColor: '#E2725B',
      killServiceOnDestroy: false,
    },
  });
}

export type BackgroundAccess = 'granted' | 'denied' | 'undetermined';

type SharingValue = {
  /** The live party your position is going to, if any. */
  target: SharingTarget | null;
  /** True when the OS task is running, i.e. sharing survives the app being closed or locked. */
  background: boolean;
  backgroundAccess: BackgroundAccess;
  /** Start sharing with a party. Asks for "Allow all the time" if it hasn't been answered yet. */
  start: (party: SharingTarget) => Promise<void>;
  stop: () => Promise<void>;
  /** Re-asks for background access (or opens Settings when the OS won't ask again). */
  requestBackground: () => Promise<void>;
  /** Re-checks the server for your live party; call after create/join/leave/end. */
  refresh: () => Promise<void>;
};

const SharingContext = React.createContext<SharingValue>({
  target: null,
  background: false,
  backgroundAccess: 'undetermined',
  start: async () => {},
  stop: async () => {},
  requestBackground: async () => {},
  refresh: async () => {},
});

export function SharingProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { location } = useLocation();
  const [target, setTarget] = React.useState<SharingTarget | null>(null);
  const [background, setBackground] = React.useState(false);
  const [backgroundAccess, setBackgroundAccess] = React.useState<BackgroundAccess>('undetermined');
  const userId = profile?.id;

  const syncTaskState = React.useCallback(async () => {
    setBackground(await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false));
    const perm = await Location.getBackgroundPermissionsAsync().catch(() => null);
    setBackgroundAccess(perm?.status === 'granted' ? 'granted' : perm?.status === 'denied' ? 'denied' : 'undetermined');
  }, []);

  const begin = React.useCallback(
    async (party: SharingTarget, ask: boolean) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ id: party.id, name: party.name }));
      setTarget({ id: party.id, name: party.name });
      let perm = await Location.getBackgroundPermissionsAsync().catch(() => null);
      if (ask && perm?.status === 'undetermined' && perm.canAskAgain) {
        // Android needs foreground access first; it's normally granted already.
        await Location.requestForegroundPermissionsAsync();
        perm = await Location.requestBackgroundPermissionsAsync().catch(() => null);
      }
      if (perm?.status === 'granted') await startTask(party).catch(() => {});
      await syncTaskState();
    },
    [syncTaskState]
  );

  const stop = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await stopTask();
    setTarget(null);
    await syncTaskState();
  }, [syncTaskState]);

  // Read through refs so the AppState listener below always sees the current state.
  const targetRef = React.useRef(target);
  targetRef.current = target;

  const refresh = React.useCallback(async () => {
    if (!userId) return;
    try {
      const live = await parties.current(userId);
      if (!live) return stop();
      const running = await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false);
      // Resuming on launch never pops a permission prompt; that only happens when you start or join.
      if (live.id !== targetRef.current?.id || !running) await begin(live, false);
      else await syncTaskState();
    } catch {}
  }, [userId, begin, stop, syncTaskState]);

  const requestBackground = React.useCallback(async () => {
    const perm = await Location.getBackgroundPermissionsAsync();
    if (perm.status !== 'granted' && !perm.canAskAgain) {
      await Linking.openSettings();
      return;
    }
    const next = await Location.requestBackgroundPermissionsAsync();
    if (next.status === 'granted' && target) await startTask(target).catch(() => {});
    await syncTaskState();
  }, [target, syncTaskState]);

  // Reconcile with the server on sign-in and whenever the app comes back to the foreground
  // (you might have been removed, or the host ended the party while you were away).
  React.useEffect(() => {
    if (!userId) return;
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [userId, refresh]);

  React.useEffect(() => {
    if (!userId) stopTask().then(() => AsyncStorage.removeItem(STORAGE_KEY));
  }, [userId]);

  // Foreground fallback when the OS task isn't running: post from the shared watcher,
  // throttled, plus a heartbeat so a parked phone still looks live to the others.
  const coords = location.status === 'ready' ? location.coords : null;
  const coordsRef = React.useRef(coords);
  coordsRef.current = coords;
  const lastSent = React.useRef(0);

  const postForeground = React.useCallback(
    async (force: boolean) => {
      const c = coordsRef.current;
      if (!target || background || !c) return;
      if (!force && Date.now() - lastSent.current < MIN_INTERVAL_MS) return;
      lastSent.current = Date.now();
      const stillLive = await parties.shareLocation(target.id, c).catch((e: Error) => {
        console.warn('[sharing] post failed:', e.message);
        return true;
      });
      if (!stillLive) stop();
    },
    [target?.id, background, stop]
  );

  React.useEffect(() => {
    postForeground(false);
  }, [coords?.latitude, coords?.longitude, postForeground]);

  React.useEffect(() => {
    if (!target || background) return;
    postForeground(true);
    const id = setInterval(() => postForeground(true), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [target?.id, background, postForeground]);

  const value = React.useMemo(
    () => ({
      target,
      background,
      backgroundAccess,
      start: (party: SharingTarget) => begin(party, Platform.OS !== 'web'),
      stop,
      requestBackground,
      refresh,
    }),
    [target, background, backgroundAccess, begin, stop, requestBackground, refresh]
  );

  return <SharingContext.Provider value={value}>{children}</SharingContext.Provider>;
}

export function useSharing() {
  return React.useContext(SharingContext);
}
