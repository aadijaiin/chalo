import { supabase } from '@/lib/supabase';
import { Coffee, Flag, Fuel, Hand, Siren, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';

export type PingKind = 'chai' | 'fuel' | 'food' | 'wait' | 'sos' | 'arrived';

export type Ping = { id: number; partyId: string; userId: string; kind: PingKind; at: number; clearedAt: number | null };

export type PingRow = {
  id: number;
  party_id: string;
  user_id: string;
  kind: PingKind;
  created_at: string;
  cleared_at: string | null;
};

const MIN = 60_000;

export const PING_META: Record<
  PingKind,
  { icon: LucideIcon; label: string; says: string; done: string; lastsMs: number }
> = {
  chai: { icon: Coffee, label: 'Chai stop', says: 'wants a chai stop', done: 'Back on the road', lastsMs: 30 * MIN },
  fuel: { icon: Fuel, label: 'Fuel', says: 'needs fuel', done: 'Tank full', lastsMs: 30 * MIN },
  food: { icon: UtensilsCrossed, label: 'Food break', says: 'is hungry', done: 'Done eating', lastsMs: 45 * MIN },
  wait: { icon: Hand, label: 'Wait up', says: 'asked everyone to wait up', done: 'Caught up', lastsMs: 15 * MIN },
  // An SOS stays up until someone clears it; the cap only catches one that was forgotten.
  sos: { icon: Siren, label: 'SOS', says: 'needs help', done: "I'm OK, cancel SOS", lastsMs: 6 * 60 * MIN },
  arrived: { icon: Flag, label: 'Arrived', says: 'arrived', done: 'Clear', lastsMs: 15 * MIN },
};

/** The ones you can send with a tap; SOS has its own hold-to-send button and arrivals are automatic. */
export const QUICK_PINGS: PingKind[] = ['chai', 'fuel', 'food', 'wait'];

/** How far back to load, so a long-running SOS still shows after reopening the app. */
export const PING_LOOKBACK_MS = PING_META.sos.lastsMs;

export function toPing(row: PingRow): Ping {
  return {
    id: row.id,
    partyId: row.party_id,
    userId: row.user_id,
    kind: row.kind,
    at: new Date(row.created_at).getTime(),
    clearedAt: row.cleared_at ? new Date(row.cleared_at).getTime() : null,
  };
}

export function isActive(p: Ping, now: number) {
  return p.clearedAt == null && now - p.at < PING_META[p.kind].lastsMs;
}

/** Each member's current status: an active SOS wins, otherwise their latest active ping. */
export function activeStatuses(list: Ping[], now: number) {
  const out: Record<string, Ping> = {};
  for (const p of list) {
    if (!isActive(p, now)) continue;
    const cur = out[p.userId];
    if (!cur || (cur.kind !== 'sos' && (p.kind === 'sos' || p.at >= cur.at))) out[p.userId] = p;
  }
  return out;
}

export const pings = {
  async send(partyId: string, kind: PingKind) {
    const { error } = await supabase.rpc('send_ping', { pid: partyId, kind });
    if (!error) return;
    if (error.message.includes('slow_down')) throw new Error('You just pinged. Give it a few seconds.');
    if (error.message.includes('not_in_party')) throw new Error("You're not live in this party.");
    throw new Error(error.message);
  },

  async clear(pingId: number) {
    const { error } = await supabase.rpc('clear_ping', { ping_id: pingId });
    if (error && !error.message.includes('ping_not_found')) throw new Error(error.message);
  },

  async recent(partyId: string, sinceMs: number) {
    const { data, error } = await supabase
      .from('party_pings')
      .select('*')
      .eq('party_id', partyId)
      .gte('created_at', new Date(Date.now() - sinceMs).toISOString())
      .order('created_at')
      .returns<PingRow[]>();
    if (error) throw new Error(error.message);
    return data.map(toPing);
  },
};
