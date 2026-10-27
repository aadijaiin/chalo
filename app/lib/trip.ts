import { distanceM } from '@/lib/location';
import {
  destinationKey,
  fetchRoute,
  paceFactor,
  progressAlong,
  routeAhead,
  toLegEnd,
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

/** A stop pin on the way; every one of them is on everyone's route. */
export type Stop = { id: string; name: string; lat: number; lng: number };

export type TripEta = {
  /** To the destination, through the stops still ahead. */
  remainingM: number;
  /** Null when we couldn't get a route and only know the straight-line distance. */
  etaS: number | null;
  arrived: boolean;
  /** The next stop on your route, if any. */
  next?: { id: string; name: string; remainingM: number; etaS: number | null } | null;
};

type TripState = {
  key: string;
  /** The stops the current route goes through, in order; a change means re-routing. */
  viaKey: string;
  /** Stops you've already been to on this trip. */
  passed: string[];
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
// After the stops change, re-route right away, but don't hammer the server if that fails.
const STOPS_RETRY_MS = 10_000;
// Roads wind; use this when we only have the straight line.
const DETOUR = 1.3;
// Close enough to a stop to count as having been there.
const PASSED_M = 150;
// A stop farther from the destination than you (by this much) is behind you: skip it.
const BEHIND_SLACK_M = 1_000;
// OSRM's public server takes a limited number of waypoints.
const MAX_STOPS = 8;

/**
 * The stops still ahead of you, in the order you'll reach them. Without a road route to
 * order them by, this goes by distance to the destination: farthest first, and anything
 * farther away than you are has been left behind. Good for the A-to-B trips chalo is for.
 */
export function stopsAhead(
  stops: Stop[],
  passed: string[],
  pos: { latitude: number; longitude: number },
  dest: { lat: number; lng: number }
): Stop[] {
  const toDest = (p: { lat: number; lng: number }) => distanceM({ latitude: p.lat, longitude: p.lng }, { latitude: dest.lat, longitude: dest.lng });
  const mine = distanceM(pos, { latitude: dest.lat, longitude: dest.lng });
  return stops
    .filter((s) => !passed.includes(s.id) && toDest(s) < mine + BEHIND_SLACK_M)
    .sort((a, b) => toDest(b) - toDest(a))
    .slice(0, MAX_STOPS);
}

const viaKeyOf = (stops: Stop[]) => stops.map((s) => `${s.id}@${destinationKey(s)}`).join('|');

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
  stops: Stop[],
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
      : {
          key,
          viaKey: '',
          passed: [],
          route: null,
          pace: { actualS: 0, predictedS: 0 },
          last: null,
          fetchedAt: 0,
          noRoute: false,
          offRouteFixes: 0,
          eta: null,
          ahead: null,
        };
  // Older saved state predates stops.
  s = { ...s, passed: s.passed ?? [], viaKey: s.viaKey ?? '' };

  // Tick off any stop you've reached, then route through the rest.
  const reached = stops.filter((st) => !s.passed.includes(st.id) && distanceM(c, { latitude: st.lat, longitude: st.lng }) < PASSED_M);
  if (reached.length) s = { ...s, passed: [...s.passed, ...reached.map((st) => st.id)] };
  const via = stopsAhead(stops, s.passed, c, dest);
  const viaKey = viaKeyOf(via);
  const viaChanged = viaKey !== s.viaKey;

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
  const due = viaChanged
    ? now - s.fetchedAt > STOPS_RETRY_MS
    : !s.route
      ? now - s.fetchedAt > (s.noRoute ? NO_ROUTE_RETRY_MS : RETRY_GAP_MS)
      : offRouteFixes >= 2 && now - s.fetchedAt > REROUTE_GAP_MS;
  let routeChanged = false;
  if (due && !fetching) {
    fetching = true;
    try {
      const route = await fetchRoute(pos, dest, via);
      s = { ...s, route, viaKey, noRoute: !route, fetchedAt: now, last: null };
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
    const factor = paceFactor(pace);
    const leg = via.length && s.viaKey === viaKey ? toLegEnd(s.route, progress) : null;
    const next =
      leg && !arrived
        ? { id: via[0].id, name: via[0].name, remainingM: leg.remainingM, etaS: Math.round(leg.remainingS * factor) }
        : null;
    s = {
      ...s,
      pace,
      offRouteFixes: routeChanged ? 0 : offRouteFixes,
      last: { at: now, remainingS: progress.remainingS, index: progress.index },
      eta: arrived
        ? { remainingM: 0, etaS: 0, arrived: true }
        : { remainingM, etaS: Math.round(progress.remainingS * factor), arrived: false, next },
      ahead: arrived ? null : routeAhead(s.route, pos, progress.index),
    };
  } else {
    const first = via[0];
    const next = first
      ? { id: first.id, name: first.name, remainingM: distanceM(c, { latitude: first.lat, longitude: first.lng }) * DETOUR, etaS: null }
      : null;
    s = { ...s, eta: { remainingM: straightM * DETOUR, etaS: null, arrived: false, next }, ahead: null };
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
