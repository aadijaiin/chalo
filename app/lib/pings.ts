import { supabase } from '@/lib/supabase';
import { Coffee, Flag, Fuel, Hand, MessageSquareText, Siren, Snail, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';

export type PingKind = 'chai' | 'fuel' | 'food' | 'wait' | 'custom' | 'sos' | 'arrived' | 'behind';

export type Ping = {
  id: number;
  partyId: string;
  userId: string;
  kind: PingKind;
  /** Your own words for a custom stop, or the gap ("6 km") for a server-set 'behind'. */
  message: string | null;
  at: number;
  clearedAt: number | null;
};

export const MESSAGE_MAX = 80;

export type PingRow = {
  id: number;
  party_id: string;
  user_id: string;
  kind: PingKind;
  message: string | null;
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
  custom: { icon: MessageSquareText, label: 'Stopping', says: 'is stopping', done: 'Done', lastsMs: 30 * MIN },
  // An SOS stays up until someone clears it; the cap only catches one that was forgotten.
  sos: { icon: Siren, label: 'SOS', says: 'needs help', done: "I'm OK, cancel SOS", lastsMs: 6 * 60 * MIN },
  arrived: { icon: Flag, label: 'Arrived', says: 'arrived', done: 'Clear', lastsMs: 15 * MIN },
  // Set and cleared by the server as the gap to the lead opens and closes.
  behind: { icon: Snail, label: 'Fell behind', says: 'has fallen behind the group', done: 'Dismiss', lastsMs: 2 * 60 * MIN },
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
    message: row.message ?? null,
    at: new Date(row.created_at).getTime(),
    clearedAt: row.cleared_at ? new Date(row.cleared_at).getTime() : null,
  };
}

/** What a status says: your words for a custom stop, otherwise the kind's label. */
export function pingLabel(p: Pick<Ping, 'kind' | 'message'>) {
  if (p.kind === 'custom' && p.message) return p.message;
  if (p.kind === 'behind' && p.message) return `${p.message} behind`;
  return PING_META[p.kind].label;
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
  async send(partyId: string, kind: PingKind, message?: string) {
    const note = message?.trim();
    // Only custom stops carry a message, so other pings also work against the older send_ping().
    const { error } = await supabase.rpc('send_ping', { pid: partyId, kind, ...(note ? { message: note } : {}) });
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
