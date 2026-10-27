import { distanceM } from '@/lib/location';
import type { PingKind } from '@/lib/pings';
import type { LngLat } from '@/lib/routing';
import { supabase } from '@/lib/supabase';
import * as React from 'react';

/** One member's trip, from the breadcrumb trail share_location() keeps. */
export type MemberRecap = {
  userId: string;
  trail: LngLat[];
  distanceM: number;
  /** First to last point. */
  durationS: number;
  /** Time spent actually moving, so a long lunch doesn't drag the average down. */
  movingS: number;
  topSpeedKmh: number | null;
  stops: number;
};

export type Recap = {
  members: Record<string, MemberRecap>;
  totalM: number;
  startedAt: number | null;
  endedAt: number | null;
};

type PointRow = { user_id: string; lat: number; lng: number; speed: number | null; at: string };

// GPS speed glitches show up as absurd values; anything past this isn't a road trip.
const MAX_PLAUSIBLE_MS = 70;
// Points this far apart in time with almost no distance between them were a stop, not driving.
const MOVING_MIN_MS = 1.5;
const STOP_KINDS: PingKind[] = ['chai', 'fuel', 'food', 'custom'];

function summarize(userId: string, rows: PointRow[], stops: number): MemberRecap {
  const trail: LngLat[] = rows.map((r) => [r.lng, r.lat]);
  let dist = 0;
  let moving = 0;
  let top = 0;
  for (let i = 1; i < rows.length; i++) {
    const [a, b] = [rows[i - 1], rows[i]];
    const d = distanceM(
      { latitude: a.lat, longitude: a.lng },
      { latitude: b.lat, longitude: b.lng }
    );
    const dt = (new Date(b.at).getTime() - new Date(a.at).getTime()) / 1000;
    dist += d;
    if (dt > 0 && d / dt >= MOVING_MIN_MS) moving += dt;
  }
  for (const r of rows)
    if (r.speed != null && r.speed < MAX_PLAUSIBLE_MS) top = Math.max(top, r.speed);
  const first = rows[0] ? new Date(rows[0].at).getTime() : 0;
  const last = rows.length ? new Date(rows[rows.length - 1].at).getTime() : 0;
  return {
    userId,
    trail,
    distanceM: dist,
    durationS: (last - first) / 1000,
    movingS: moving,
    topSpeedKmh: top > 0 ? Math.round(top * 3.6) : null,
    stops,
  };
}

async function loadRecap(partyId: string): Promise<Recap> {
  // A long trip can have thousands of points; page through them.
  const rows: PointRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('party_track_points')
      .select('user_id, lat, lng, speed, at')
      .eq('party_id', partyId)
      .order('id')
      .range(from, from + 999)
      .returns<PointRow[]>();
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const { data: pings } = await supabase
    .from('party_pings')
    .select('user_id, kind')
    .eq('party_id', partyId)
    .in('kind', STOP_KINDS)
    .returns<{ user_id: string; kind: PingKind }[]>();
  const stopsBy: Record<string, number> = {};
  for (const p of pings ?? []) stopsBy[p.user_id] = (stopsBy[p.user_id] ?? 0) + 1;

  const byUser: Record<string, PointRow[]> = {};
  for (const r of rows) (byUser[r.user_id] ??= []).push(r);
  const members: Record<string, MemberRecap> = {};
  for (const [id, list] of Object.entries(byUser))
    members[id] = summarize(id, list, stopsBy[id] ?? 0);

  const times = rows.map((r) => new Date(r.at).getTime());
  return {
    members,
    totalM: Object.values(members).reduce((s, m) => s + m.distanceM, 0),
    startedAt: times.length ? Math.min(...times) : null,
    endedAt: times.length ? Math.max(...times) : null,
  };
}

export function useRecap(partyId: string) {
  const [state, setState] = React.useState<
    { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; recap: Recap }
  >({ status: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    loadRecap(partyId)
      .then((recap) => !cancelled && setState({ status: 'ready', recap }))
      .catch((e) => !cancelled && setState({ status: 'error', message: (e as Error).message }));
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  return state;
}
