import { useAuth } from '@/lib/auth';
import { distanceM, useLocation } from '@/lib/location';
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
const MOTION_KEY = 'chalo.sharing.motion';

type SharingTarget = Pick<Party, 'id' | 'name'>;

// Posting: every post is fanned out to the whole party over Realtime, so only post when the
// others would notice: you moved a bit since the last post, or it's time for a heartbeat that
// keeps you looking live while parked. share_location() drops anything chattier than this.
const POST_MOVED_M = 20;
const POST_MIN_GAP_MS = 10_000;
const HEARTBEAT_MS = 60_000;

// GPS: high accuracy while moving; once you've stayed within PARK_RADIUS_M for PARK_AFTER_MS,
// drop to network-level accuracy until a fix shows you've left that spot.
const PARK_RADIUS_M = 40;
const PARK_AFTER_MS = 2 * 60_000;

type Mode = 'moving' | 'parked';
type Fix = { latitude: number; longitude: number; accuracy: number | null; at: number };
type Motion = {
  mode: Mode;
  /** Where you've been since you last moved more than PARK_RADIUS_M. */
  anchor: Fix;
  lastPost: Fix | null;
  /** The OS task was last reconfigured from the background, without its notification options. */
  bare?: boolean;
};

// Kept in memory and mirrored to storage, since the OS may relaunch the JS just to run the task.
let motion: Motion | null = null;

async function readMotion() {
  if (motion) return motion;
  const raw = await AsyncStorage.getItem(MOTION_KEY).catch(() => null);
  motion = raw ? (JSON.parse(raw) as Motion) : null;
  return motion;
}

function saveMotion(next: Motion | null) {
  motion = next;
  (next ? AsyncStorage.setItem(MOTION_KEY, JSON.stringify(next)) : AsyncStorage.removeItem(MOTION_KEY)).catch(() => {});
}

function toFix(c: { latitude: number; longitude: number; accuracy: number | null }, at = Date.now()): Fix {
  return { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy, at };
}

function shouldPost(last: Fix | null, fix: Fix) {
  if (!last) return true;
  const elapsed = fix.at - last.at;
  return elapsed >= HEARTBEAT_MS || (elapsed >= POST_MIN_GAP_MS && distanceM(last, fix) >= POST_MOVED_M);
}

function nextMode(m: Motion, fix: Fix): Pick<Motion, 'mode' | 'anchor'> {
  // A coarse fix can wander by its accuracy radius without you going anywhere.
  const radius = Math.max(PARK_RADIUS_M, fix.accuracy ?? 0, m.anchor.accuracy ?? 0);
  if (distanceM(m.anchor, fix) > radius) return { mode: 'moving', anchor: fix };
  if (m.mode === 'moving' && fix.at - m.anchor.at >= PARK_AFTER_MS) return { mode: 'parked', anchor: m.anchor };
  return { mode: m.mode, anchor: m.anchor };
}

async function readTarget(): Promise<SharingTarget | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  return raw ? (JSON.parse(raw) as SharingTarget) : null;
}

async function stopTask() {
  saveMotion(null);
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK).catch(() => {});
  }
}

/** Posts if it's worth it; returns false once you're no longer live in the party. */
async function post(target: SharingTarget, c: Location.LocationObjectCoords, force = false) {
  const m = await readMotion();
  const fix = toFix(c);
  if (!force && !shouldPost(m?.lastPost ?? null, fix)) return true;
  const stillLive = await parties.shareLocation(target.id, c);
  const latest = await readMotion();
  saveMotion({ ...(latest ?? { mode: 'moving', anchor: fix }), lastPost: fix });
  return stillLive;
}

// Runs in the background (and foreground) whenever the OS delivers new fixes.
// Must be defined at module scope so it exists when the OS relaunches the JS.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const target = await readTarget();
  if (!target) return stopTask();
  const latest = data.locations[data.locations.length - 1];
  const fix = toFix(latest.coords, latest.timestamp);

  const m = (await readMotion()) ?? { mode: 'moving', anchor: fix, lastPost: null };
  const next = nextMode(m, fix);
  let bare = m.bare;
  if (next.mode !== m.mode) {
    try {
      bare = await configureTask(target, next.mode);
    } catch (e) {
      // Stay in the old mode and try again on the next fix.
      console.warn('[sharing] switching GPS mode failed:', (e as Error).message);
      next.mode = m.mode;
    }
  }
  saveMotion({ ...m, ...next, bare });

  try {
    if (!(await post(target, latest.coords))) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await stopTask();
    }
  } catch (e) {
    // Offline or token refresh in flight; the next fix will try again.
    console.warn('[sharing] background post failed:', (e as Error).message);
  }
});

/**
 * Starts the OS task, or retunes it in place when it's already running.
 * Android refuses foreground-service options from the background, but leaving them out there
 * keeps the running service (and its notification) as is. Returns true when they were left out.
 */
async function configureTask(target: SharingTarget, mode: Mode) {
  const moving = mode === 'moving';
  const withNotification = Platform.OS !== 'android' || AppState.currentState === 'active';
  await Location.startLocationUpdatesAsync(TASK, {
    accuracy: moving ? Location.Accuracy.High : Location.Accuracy.Balanced,
    // Android: a fix every interval even when still, which is how we notice you've parked and
    // what keeps the heartbeat going. iOS ignores timeInterval, so it filters by distance instead.
    timeInterval: moving ? 5_000 : 60_000,
    distanceInterval: Platform.OS === 'android' ? 0 : moving ? 5 : PARK_RADIUS_M,
    activityType: Location.ActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    ...(withNotification && {
      foregroundService: {
        notificationTitle: `Sharing your location · ${target.name}`,
        notificationBody: 'Your party can see you on the map. Leave the party in chalo to stop.',
        notificationColor: '#E2725B',
        killServiceOnDestroy: false,
      },
    }),
  });
  return !withNotification;
}

async function startTask(target: SharingTarget) {
  await stopTask();
  await configureTask(target, 'moving');
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
      if (live.id !== targetRef.current?.id || !running) return begin(live, false);
      // Put back the notification options a background mode switch had to leave out.
      const m = await readMotion();
      if (m?.bare && AppState.currentState === 'active') {
        await configureTask(live, m.mode)
          .then(() => saveMotion({ ...m, bare: false }))
          .catch(() => {});
      }
      await syncTaskState();
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

  // While the app is open, post from the shared watcher too: it's the only source when the OS
  // task isn't running, and it keeps the heartbeat going when the task goes quiet (an iOS phone
  // that hasn't moved). Both paths share one throttle, so nothing is posted twice.
  const coords = location.status === 'ready' ? location.coords : null;
  const coordsRef = React.useRef(coords);
  coordsRef.current = coords;

  const postForeground = React.useCallback(async () => {
    const c = coordsRef.current;
    if (!target || !c || AppState.currentState !== 'active') return;
    const stillLive = await post(target, c).catch((e: Error) => {
      console.warn('[sharing] post failed:', e.message);
      return true;
    });
    if (!stillLive) stop();
  }, [target?.id, stop]);

  React.useEffect(() => {
    if (!background) postForeground();
  }, [coords?.latitude, coords?.longitude, background, postForeground]);

  React.useEffect(() => {
    if (!target) return;
    const id = setInterval(postForeground, 15_000);
    return () => clearInterval(id);
  }, [target?.id, postForeground]);

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
