import { distanceM } from '@/lib/location';
import { fetchRoute, progressAlong, routeAhead, type LngLat, type Route } from '@/lib/routing';
import * as React from 'react';

type Point = { latitude: number; longitude: number };

export type RouteTo =
  | { status: 'off' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'together' }
  | { status: 'ready'; line: LngLat[]; remainingM: number; remainingS: number };

// Both ends move, so re-route once either has gone this far, but not more than every 30 s
// (the public OSRM server is fair use). In between, progress is tracked along the line.
const REFETCH_MOVED_M = 250;
const REFETCH_GAP_MS = 30_000;
const TOGETHER_M = 80;

/** A live route from you to someone else in the party, refreshed as you both move. */
export function useRouteTo(enabled: boolean, from: Point | null, to: Point | null): RouteTo {
  const [route, setRoute] = React.useState<{ route: Route | null; from: Point; to: Point; at: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inFlight = React.useRef(false);

  const together = from && to ? distanceM(from, to) < TOGETHER_M : false;
  const stale =
    !route ||
    (from && to
      ? (distanceM(route.from, from) > REFETCH_MOVED_M || distanceM(route.to, to) > REFETCH_MOVED_M) &&
        Date.now() - route.at > REFETCH_GAP_MS
      : false);

  React.useEffect(() => {
    if (!enabled) {
      setRoute(null);
      setError(null);
      return;
    }
    if (!from || !to || together || !stale || inFlight.current) return;
    inFlight.current = true;
    const start = { ...from };
    const end = { ...to };
    fetchRoute([start.longitude, start.latitude], { lat: end.latitude, lng: end.longitude })
      .then((r) => {
        setRoute({ route: r, from: start, to: end, at: Date.now() });
        setError(r ? null : 'No road route between you two.');
      })
      .catch((e) => {
        // Record the attempt too, so a failing server isn't asked again on every fix.
        setRoute({ route: null, from: start, to: end, at: Date.now() });
        setError((e as Error).message);
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [enabled, from?.latitude, from?.longitude, to?.latitude, to?.longitude, together, stale]);

  if (!enabled) return { status: 'off' };
  if (together) return { status: 'together' };
  if (!route?.route) return error ? { status: 'error', message: error } : { status: 'loading' };
  if (!from || !to) return { status: 'loading' };

  // Track you along the line, and the far end is wherever they are now.
  const pos: LngLat = [from.longitude, from.latitude];
  const p = progressAlong(route.route, pos);
  const line = [...routeAhead(route.route, pos, p.index).slice(0, -1), [to.longitude, to.latitude] as LngLat];
  return { status: 'ready', line, remainingM: p.remainingM, remainingS: p.remainingS };
}
