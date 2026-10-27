import { distanceM } from '@/lib/location';
import {
  destinationKey,
  fetchRoute,
  paceFactor,
  progressAlong,
  routeAhead,
  updatePace,
  type LngLat,
  type Pace,
  type Route,
} from '@/lib/routing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

/**
 * Your own trip to the party's destination: the route, where you are along it, and your ETA.
 * Runs wherever your position is posted from (the background task or the open app), so the
 * ETA you post stays fresh with the phone locked. The map reads it through useMyTrip().
 */

export type Destination = { name: string; lat: number; lng: number };

export type TripEta = {
  remainingM: number;
  /** Null when we couldn't get a route and only know the straight-line distance. */
  etaS: number | null;
  arrived: boolean;
};

type TripState = {
  key: string;
  /** Null when routing failed or there's no road route; we fall back to straight-line distance. */
  route: Route | null;
  pace: Pace;
  last: { at: number; remainingS: number; index: number } | null;
  fetchedAt: number;
  /** OSRM found no road there; don't keep asking. */
  noRoute: boolean;
  offRouteFixes: number;
  eta: TripEta | null;
  ahead: LngLat[] | null;
};

const STATE_KEY = 'chalo.trip';
const ROUTE_KEY = 'chalo.trip.route';
const ARRIVED_M = 120;
const OFF_ROUTE_M = 120;
const REROUTE_GAP_MS = 60_000;
const RETRY_GAP_MS = 30_000;
const NO_ROUTE_RETRY_MS = 10 * 60_000;
// Roads wind; use this when we only have the straight line.
const DETOUR = 1.3;

let state: TripState | null = null;
let loaded = false;
// The background task and the open app can both post; only one of them fetches at a time.
let fetching = false;
const listeners = new Set<() => void>();

async function load() {
  if (loaded) return state;
  loaded = true;
  try {
    const [s, r] = await Promise.all([AsyncStorage.getItem(STATE_KEY), AsyncStorage.getItem(ROUTE_KEY)]);
    if (s) state = { ...(JSON.parse(s) as Omit<TripState, 'route'>), route: r ? (JSON.parse(r) as Route) : null };
  } catch {}
  return state;
}

function save(next: TripState | null, routeChanged: boolean) {
  state = next;
  listeners.forEach((l) => l());
  const { route, ahead, ...small } = next ?? ({} as TripState);
  (next ? AsyncStorage.setItem(STATE_KEY, JSON.stringify(small)) : AsyncStorage.removeItem(STATE_KEY)).catch(() => {});
  if (routeChanged || !next) {
    (route ? AsyncStorage.setItem(ROUTE_KEY, JSON.stringify(route)) : AsyncStorage.removeItem(ROUTE_KEY)).catch(() => {});
  }
}

export function clearTrip() {
  save(null, true);
}

/** Advances your trip with a new fix and returns the ETA to post, or null with no destination. */
export async function tripUpdate(
  dest: Destination | null,
  c: { latitude: number; longitude: number; accuracy: number | null },
  now = Date.now()
): Promise<TripEta | null> {
  if (!dest) {
    if (await load()) clearTrip();
    return null;
  }
  const pos: LngLat = [c.longitude, c.latitude];
  const key = destinationKey(dest);
  const prev = await load();
  let s: TripState =
    prev?.key === key
      ? prev
      : { key, route: null, pace: { actualS: 0, predictedS: 0 }, last: null, fetchedAt: 0, noRoute: false, offRouteFixes: 0, eta: null, ahead: null };

  const straightM = distanceM(c, { latitude: dest.lat, longitude: dest.lng });
  if (straightM < ARRIVED_M) {
    s = { ...s, eta: { remainingM: 0, etaS: 0, arrived: true }, ahead: null };
    save(s, false);
    return s.eta;
  }

  let progress = s.route ? progressAlong(s.route, pos, s.last?.index) : null;
  const offRoute = progress ? progress.offRouteM > Math.max(OFF_ROUTE_M, (c.accuracy ?? 0) * 1.5) : false;
  const offRouteFixes = offRoute ? s.offRouteFixes + 1 : 0;

  // Fetch the first route, retry a failed one, or re-route once you've clearly left it.
  const due = !s.route
    ? now - s.fetchedAt > (s.noRoute ? NO_ROUTE_RETRY_MS : RETRY_GAP_MS)
    : offRouteFixes >= 2 && now - s.fetchedAt > REROUTE_GAP_MS;
  let routeChanged = false;
  if (due && !fetching) {
    fetching = true;
    try {
      const route = await fetchRoute(pos, dest);
      s = { ...s, route, noRoute: !route, fetchedAt: now, last: null };
      progress = route ? progressAlong(route, pos) : null;
      routeChanged = true;
    } catch (e) {
      s = { ...s, fetchedAt: now };
      console.warn('[trip] routing failed:', (e as Error).message);
    } finally {
      fetching = false;
    }
  }

  if (s.route && progress) {
    const pace = s.last
      ? updatePace(s.pace, (now - s.last.at) / 1000, s.last.remainingS - progress.remainingS)
      : s.pace;
    const remainingM = progress.offRouteM > OFF_ROUTE_M ? progress.remainingM + progress.offRouteM : progress.remainingM;
    // Routes end on the nearest road, which can be well away from a big place's centre point
    // (India Gate, a park), so reaching the end of the route counts as arriving too.
    const arrived = remainingM < ARRIVED_M;
    s = {
      ...s,
      pace,
      offRouteFixes: routeChanged ? 0 : offRouteFixes,
      last: { at: now, remainingS: progress.remainingS, index: progress.index },
      eta: arrived
        ? { remainingM: 0, etaS: 0, arrived: true }
        : { remainingM, etaS: Math.round(progress.remainingS * paceFactor(pace)), arrived: false },
      ahead: arrived ? null : routeAhead(s.route, pos, progress.index),
    };
  } else {
    s = { ...s, eta: { remainingM: straightM * DETOUR, etaS: null, arrived: false }, ahead: null };
  }
  save(s, routeChanged);
  return s.eta;
}

/** Your current ETA and the route ahead of you, for the map. */
export function useMyTrip(destKey: string | null) {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    listeners.add(rerender);
    load().then(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);
  return state && destKey && state.key === destKey ? { eta: state.eta, ahead: state.ahead } : null;
}
