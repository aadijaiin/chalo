/**
 * Driving routes from the public OSRM server (free, no key, fair use: keep it to a few requests
 * per trip). A phone fetches its route once, then tracks progress along it locally and only
 * re-routes when it strays off.
 */

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

export type LngLat = [number, number];

export type Route = {
  /** Which destination this route goes to; see destinationKey(). */
  key: string;
  coords: LngLat[];
  /** Metres and seconds from the start of the route to each point. */
  cumM: number[];
  cumS: number[];
  /** Index into coords where each leg ends: one leg per stop, then the last one to the destination. */
  legEnds: number[];
};

export type Progress = {
  /** How far you are from the route line. */
  offRouteM: number;
  remainingM: number;
  /** OSRM's free-flow estimate; see Pace for the correction. */
  remainingS: number;
  /** Index of the segment you're on, a hint for the next lookup. */
  index: number;
};

export function destinationKey(d: { lat: number; lng: number }) {
  return `${d.lat.toFixed(5)},${d.lng.toFixed(5)}`;
}

/** A driving route from `from` to `to`, through `via` in order. */
export async function fetchRoute(
  from: LngLat,
  to: { lat: number; lng: number },
  via: { lat: number; lng: number }[] = []
): Promise<Route | null> {
  const points = [`${from[0]},${from[1]}`, ...via.map((v) => `${v.lng},${v.lat}`), `${to.lng},${to.lat}`];
  const url = `${OSRM}/${points.join(';')}?overview=full&geometries=geojson&annotations=duration,distance`;
  const res = await fetch(url, { headers: { 'User-Agent': 'chalo-app' } });
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);
  const body = await res.json();
  if (body.code === 'NoRoute') return null;
  if (body.code !== 'Ok' || !body.routes?.length) throw new Error(`Routing failed (${body.code})`);

  const route = body.routes[0];
  const coords: LngLat[] = route.geometry.coordinates;
  const segM: number[] = route.legs.flatMap((l: any) => l.annotation.distance);
  const segS: number[] = route.legs.flatMap((l: any) => l.annotation.duration);
  // The full line has one point more than all the legs' segments together, with each leg
  // picking up where the last one ended.
  const legEnds: number[] = [];
  let end = 0;
  for (const l of route.legs) legEnds.push((end += l.annotation.distance.length));
  const cumM = [0];
  const cumS = [0];
  for (let i = 0; i < coords.length - 1; i++) {
    cumM.push(cumM[i] + (segM[i] ?? 0));
    cumS.push(cumS[i] + (segS[i] ?? 0));
  }
  return { key: destinationKey(to), coords, cumM, cumS, legEnds };
}

// Local flat projection in metres around a latitude; fine for snapping to a nearby segment.
function project(p: LngLat, lat0: number): [number, number] {
  const k = Math.cos((lat0 * Math.PI) / 180);
  return [p[0] * 111_320 * k, p[1] * 110_540];
}

/** Snaps a position onto the route. Searches near `hint` first, since you only move forward. */
export function progressAlong(route: Route, pos: LngLat, hint = 0): Progress {
  const { coords, cumM, cumS } = route;
  const last = coords.length - 1;
  if (last < 1) return { offRouteM: 0, remainingM: 0, remainingS: 0, index: 0 };

  const p = project(pos, pos[1]);
  let best = { d2: Infinity, i: 0, t: 0 };
  const scan = (from: number, to: number) => {
    for (let i = Math.max(0, from); i < Math.min(last, to); i++) {
      const a = project(coords[i], pos[1]);
      const b = project(coords[i + 1], pos[1]);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
      const ex = a[0] + t * dx - p[0];
      const ey = a[1] + t * dy - p[1];
      const d2 = ex * ex + ey * ey;
      if (d2 < best.d2) best = { d2, i, t };
    }
  };
  scan(hint - 20, hint + 400);
  // Nothing close in the window (first lookup, or a jump): check the whole route.
  if (best.d2 > 200 * 200) scan(0, last);

  const { i, t } = best;
  const doneM = cumM[i] + t * (cumM[i + 1] - cumM[i]);
  const doneS = cumS[i] + t * (cumS[i + 1] - cumS[i]);
  return {
    offRouteM: Math.sqrt(best.d2),
    remainingM: Math.max(0, cumM[last] - doneM),
    remainingS: Math.max(0, cumS[last] - doneS),
    index: i,
  };
}

/** Distance and free-flow time from where you are to the end of the leg you're on. */
export function toLegEnd(route: Route, p: Progress) {
  const total = route.cumM[route.cumM.length - 1];
  const doneM = total - p.remainingM;
  const doneS = route.cumS[route.cumS.length - 1] - p.remainingS;
  const end = (route.legEnds ?? []).find((e) => route.cumM[e] > doneM) ?? route.coords.length - 1;
  return { remainingM: Math.max(0, route.cumM[end] - doneM), remainingS: Math.max(0, route.cumS[end] - doneS) };
}

/** The part of the route still ahead of you, for drawing. */
export function routeAhead(route: Route, pos: LngLat, index: number): LngLat[] {
  return [pos, ...route.coords.slice(index + 1)];
}

/**
 * OSRM assumes empty roads. Pace learns how your actual driving compares: seconds you took
 * versus seconds OSRM predicted for the same stretch, only counting time you were making
 * progress, so a chai stop doesn't inflate the ETA. Starts at 1x, with a 10 minute prior.
 */
export type Pace = { actualS: number; predictedS: number };

const PACE_PRIOR_S = 600;

export function paceFactor(p: Pace) {
  return Math.min(3, Math.max(0.7, (p.actualS + PACE_PRIOR_S) / (p.predictedS + PACE_PRIOR_S)));
}

export function updatePace(p: Pace, elapsedS: number, predictedDeltaS: number): Pace {
  // Ignore stops and gaps (a phone that slept) rather than counting them as slow driving.
  if (predictedDeltaS < 5 || elapsedS <= 0 || elapsedS > 5 * 60) return p;
  return { actualS: p.actualS + elapsedS, predictedS: p.predictedS + predictedDeltaS };
}

/** The point a given fraction of the way along a line, by distance (0.5 = halfway). */
export function pointAlong(line: LngLat[], fraction: number): LngLat {
  if (line.length < 2) return line[0];
  const seg = (a: LngLat, b: LngLat) => {
    const [x0, y0] = project(a, a[1]);
    const [x1, y1] = project(b, a[1]);
    return Math.hypot(x1 - x0, y1 - y0);
  };
  const lengths = line.slice(1).map((p, i) => seg(line[i], p));
  let left = lengths.reduce((s, l) => s + l, 0) * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i]) {
      const t = lengths[i] ? left / lengths[i] : 0;
      const [a, b] = [line[i], line[i + 1]];
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    }
    left -= lengths[i];
  }
  return line[line.length - 1];
}
