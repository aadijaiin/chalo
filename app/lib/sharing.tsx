import { useAuth } from '@/lib/auth';
import { distanceM, useLocation } from '@/lib/location';
import { readBattery } from '@/lib/battery';
import { parties, type Party } from '@/lib/parties';
import { registerForPush } from '@/lib/push';
import { destinationKey } from '@/lib/routing';
import { clearTrip, tripUpdate, type Destination, type Stop } from '@/lib/trip';
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

// Stops come from the server with each post, so a locked phone keeps up with the plan.
type SharingTarget = Pick<Party, 'id' | 'name' | 'destination'> & { stops?: Stop[] };

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
  if (!raw) return null;
  const t = JSON.parse(raw) as SharingTarget;
  return { ...t, destination: t.destination ?? null, stops: t.stops ?? [] };
}

function writeTarget(t: SharingTarget) {
  return AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ id: t.id, name: t.name, destination: t.destination, stops: t.stops ?? [] })
  );
}

const keyOf = (d: Destination | null) => (d ? destinationKey(d) : null);
const stopsKeyOf = (stops: Stop[] = []) =>
  stops
    .map((s) => `${s.id}@${destinationKey(s)}`)
    .sort()
    .join('|');

async function stopTask() {
  saveMotion(null);
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK).catch(() => {});
  }
}

/**
 * Posts your position (and ETA, when the party has a destination) if it's worth it.
 * Returns false once you're no longer live in the party.
 */
async function post(c: Location.LocationObjectCoords, force = false): Promise<boolean> {
  const target = await readTarget();
  if (!target) return true;
  const m = await readMotion();
  const fix = toFix(c);
  if (!force && !shouldPost(m?.lastPost ?? null, fix)) return true;
  const eta = await tripUpdate(target.destination, target.stops ?? [], c).catch(() => null);
  const res = await parties.shareLocation(target.id, c, eta, await readBattery());
  const latest = await readMotion();
  saveMotion({ ...(latest ?? { mode: 'moving', anchor: fix }), lastPost: fix });
  if (!res) return false;

  // The destination or the stops changed: remember them and post an ETA for the new plan.
  const stops = res.stops ?? [];
  if (keyOf(res.destination) !== keyOf(target.destination) || stopsKeyOf(stops) !== stopsKeyOf(target.stops)) {
    await writeTarget({ ...target, destination: res.destination, stops });
    if (res.destination) return post(c, true);
    await tripUpdate(null, [], c);
  }
  return true;
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
    if (!(await post(latest.coords))) {
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
  /** Posts right away, e.g. so a new destination gets your ETA without waiting for the next fix. */
  nudge: () => void;
};

const SharingContext = React.createContext<SharingValue>({
  target: null,
  background: false,
  backgroundAccess: 'undetermined',
  start: async () => {},
  stop: async () => {},
  requestBackground: async () => {},
  refresh: async () => {},
  nudge: () => {},
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
      const next = { id: party.id, name: party.name, destination: party.destination, stops: party.stops };
      if (party.id !== (await readTarget())?.id) clearTrip();
      await writeTarget(next);
      setTarget(next);
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
    clearTrip();
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
    const stillLive = await post(c).catch((e: Error) => {
      console.warn('[sharing] post failed:', e.message);
      return true;
    });
    if (!stillLive) stop();
  }, [target?.id, stop]);

  const nudge = React.useCallback(() => {
    const c = coordsRef.current;
    if (!target || !c) return;
    post(c, true)
      .then((stillLive) => {
        if (!stillLive) stop();
      })
      .catch((e: Error) => console.warn('[sharing] post failed:', e.message));
  }, [target?.id, stop]);

  React.useEffect(() => {
    if (!background) postForeground();
  }, [coords?.latitude, coords?.longitude, background, postForeground]);

  React.useEffect(() => {
    if (!target) return;
    const id = setInterval(postForeground, 15_000);
    return () => clearInterval(id);
  }, [target?.id, postForeground]);

  // Being in a party is when pings start to matter, so ask for notifications then. This also
  // covers people who were already in one when push shipped, who never go through start().
  // It runs after begin() has settled location, so the two prompts don't stack.
  React.useEffect(() => {
    if (target?.id) registerForPush(true);
  }, [target?.id]);

  const value = React.useMemo(
    () => ({
      target,
      background,
      backgroundAccess,
      start: async (party: SharingTarget) => {
        await begin(party, Platform.OS !== 'web');
      },
      stop,
      requestBackground,
      refresh,
      nudge,
    }),
    [target, background, backgroundAccess, begin, stop, requestBackground, refresh, nudge]
  );

  return <SharingContext.Provider value={value}>{children}</SharingContext.Provider>;
}

export function useSharing() {
  return React.useContext(SharingContext);
}
