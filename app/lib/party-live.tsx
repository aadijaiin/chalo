import { useParty, type PartyState } from '@/hooks/use-party';
import { useAuth } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { notify } from '@/lib/notify';
import { endedMessage, parties, toLocation, type LocationRow, type PartyLocation } from '@/lib/parties';
import { destinationKey } from '@/lib/routing';
import { activeStatuses, PING_LOOKBACK_MS, PING_META, pings as pingsApi, toPing, type Ping, type PingRow } from '@/lib/pings';
import { setOpenParty } from '@/lib/push';
import { useSharing } from '@/lib/sharing';
import { supabase } from '@/lib/supabase';
import * as React from 'react';

export type Peer = PartyLocation & {
  /** Posted recently enough to count as live; otherwise we show their last known spot, faded. */
  online: boolean;
};

export type Connection = 'connecting' | 'live' | 'off';

type PartyLiveValue = {
  state: PartyState;
  /** Other members' latest positions, keyed by user id. */
  peers: Record<string, Peer>;
  connection: Connection;
  /** Each member's current status (an uncleared, unexpired ping), keyed by user id. */
  pings: Record<string, Ping>;
};

const PartyLiveContext = React.createContext<PartyLiveValue>({
  state: { status: 'loading' },
  peers: {},
  connection: 'off',
  pings: {},
});


// Phones post every few seconds while moving and every 30 s when parked in the foreground;
// a locked phone that isn't moving may go quiet for longer, so give it some slack.
const STALE_AFTER_MS = 3 * 60_000;

/** A party's roster plus everyone's live position, kept fresh over Supabase Realtime. */
export function PartyLiveProvider({ partyId, children }: { partyId: string; children: React.ReactNode }) {
  const { state } = useParty(partyId);
  const { profile } = useAuth();
  const sharing = useSharing();
  const [locations, setLocations] = React.useState<Record<string, PartyLocation>>({});
  const [connection, setConnection] = React.useState<Connection>('connecting');
  const [pingList, setPingList] = React.useState<Ping[]>([]);
  const pingListRef = React.useRef(pingList);
  pingListRef.current = pingList;
  // The insert handler is set up once; read the roster through a ref for names.
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const [now, setNow] = React.useState(Date.now());
  const userId = profile?.id;

  React.useEffect(() => {
    let cancelled = false;
    // Runs on every (re)subscribe, so anything missed while disconnected is caught up.
    const load = () => {
      parties
        .locations(partyId)
        .then((list) => !cancelled && setLocations(Object.fromEntries(list.map((l) => [l.userId, l]))))
        .catch((e) => console.warn('[party-live] loading locations failed:', e.message));
      pingsApi
        .recent(partyId, PING_LOOKBACK_MS)
        .then((list) => !cancelled && setPingList(list))
        .catch((e) => console.warn('[party-live] loading pings failed:', e.message));
    };

    const channel = supabase
      .channel(`party-locations:${partyId}`)
      .on<LocationRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_locations', filter: `party_id=eq.${partyId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const gone = (payload.old as Partial<LocationRow>).user_id;
            if (gone) setLocations(({ [gone]: _, ...rest }) => rest);
            return;
          }
          const next = toLocation(payload.new);
          setLocations((prev) => ({ ...prev, [next.userId]: next }));
        }
      )
      .on<PingRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_pings', filter: `party_id=eq.${partyId}` },
        (payload) => {
          const ping = toPing(payload.new);
          setPingList((prev) => (prev.some((p) => p.id === ping.id) ? prev : [...prev, ping]));
          announcePing(ping, stateRef.current, userId);
        }
      )
      .on<PingRow>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'party_pings', filter: `party_id=eq.${partyId}` },
        (payload) => {
          const ping = toPing(payload.new);
          const before = pingListRef.current.find((p) => p.id === ping.id);
          setPingList((prev) => prev.map((p) => (p.id === ping.id ? ping : p)));
          if (before?.clearedAt == null && ping.clearedAt != null) announceCleared(ping, stateRef.current, userId);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnection('live');
          load();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[party-live] ${status}`, err?.message ?? '');
          setConnection('off');
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [partyId]);

  React.useEffect(() => {
    setOpenParty(partyId);
    return () => setOpenParty(null);
  }, [partyId]);

  // Re-evaluate who counts as live without waiting for the next update.
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  useRosterAnnouncements(state, userId, sharing);

  // A new destination: post now so everyone's ETA shows up without waiting for the next fix.
  const party = state.status === 'ready' ? state.party : null;
  const destKey = party?.destination ? destinationKey(party.destination) : null;
  const seenDest = React.useRef<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (!party) return;
    if (seenDest.current !== undefined && seenDest.current !== destKey && sharing.target?.id === party.id) sharing.nudge();
    seenDest.current = destKey;
  }, [destKey, party?.id]);

  const activeIds = state.status === 'ready' ? state.members.filter((m) => !m.leftAt).map((m) => m.userId) : [];
  const peers = React.useMemo(() => {
    const out: Record<string, Peer> = {};
    for (const id of activeIds) {
      const loc = locations[id];
      if (loc && id !== userId) out[id] = { ...loc, online: now - loc.updatedAt < STALE_AFTER_MS };
    }
    return out;
  }, [locations, activeIds.join(','), userId, now]);

  const pings = React.useMemo(() => activeStatuses(pingList, now), [pingList, now]);

  const value = React.useMemo(() => ({ state, peers, connection, pings }), [state, peers, connection, pings]);
  return <PartyLiveContext.Provider value={value}>{children}</PartyLiveContext.Provider>;
}

/** Toast for someone else's ping; SOS gets the loud treatment. */
function announcePing(ping: Ping, state: PartyState, userId: string | undefined) {
  if (ping.userId === userId || state.status !== 'ready') return;
  const m = state.members.find((x) => x.userId === ping.userId);
  const who = m ? m.fullName.split(' ')[0] || m.username : 'Someone';
  const meta = PING_META[ping.kind];
  if (ping.kind === 'sos') {
    haptics.error();
    notify.error(`SOS from ${who}`, `${who} needs help. Check the map to see where they are.`);
    return;
  }
  haptics.success();
  const where = ping.kind === 'arrived' && state.party.destination ? ` at ${state.party.destination.name}` : '';
  notify.info(meta.label, `${who} ${meta.says}${where}.`);
}

/** Only an SOS ending is worth interrupting for; other statuses just disappear from the map. */
function announceCleared(ping: Ping, state: PartyState, userId: string | undefined) {
  if (ping.kind !== 'sos' || ping.userId === userId || state.status !== 'ready') return;
  const m = state.members.find((x) => x.userId === ping.userId);
  const who = m ? m.fullName.split(' ')[0] || m.username : 'Someone';
  haptics.success();
  notify.success('SOS cancelled', `${who} is OK.`);
}

/** Toasts when someone joins or leaves, and stops sharing if the host ends the party under you. */
function useRosterAnnouncements(state: PartyState, userId: string | undefined, sharing: ReturnType<typeof useSharing>) {
  const known = React.useRef<Set<string> | null>(null);
  const wasLive = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (state.status !== 'ready') return;
    const { party, members } = state;
    const active = members.filter((m) => !m.leftAt);
    const ids = new Set(active.map((m) => m.userId));

    if (known.current) {
      for (const m of active) {
        if (!known.current.has(m.userId) && m.userId !== userId) {
          haptics.success();
          notify.info(`${m.fullName.split(' ')[0] || m.username} joined`, `Now ${active.length} in ${party.name}.`);
        }
      }
      for (const id of known.current) {
        const m = members.find((x) => x.userId === id);
        if (!ids.has(id) && m && id !== userId) notify.info(`${m.fullName.split(' ')[0] || m.username} left the party`);
      }
    }
    known.current = ids;

    const live = !party.endedAt;
    if (wasLive.current && !live && (party.hostId !== userId || party.endedReason !== 'host')) {
      notify.info(
        party.endedReason === 'host' ? 'The host ended this party' : `${party.name} has ended`,
        `${party.endedReason === 'host' ? '' : endedMessage(party.endedReason) + ' '}Location sharing has stopped.`
      );
    }
    if (wasLive.current && !live && sharing.target?.id === party.id) sharing.stop();
    wasLive.current = live;
  }, [state]);
}

export function usePartyLive() {
  return React.useContext(PartyLiveContext);
}
