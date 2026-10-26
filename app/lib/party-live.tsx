import { useParty, type PartyState } from '@/hooks/use-party';
import { useAuth } from '@/lib/auth';
import { distanceM, useLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import * as React from 'react';

/** What each member publishes as their presence state. */
type LivePayload = {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  at: number;
};

export type Peer = LivePayload & {
  userId: string;
  /** False once their app disconnects; we keep the last fix so they stay on the map, greyed out. */
  online: boolean;
};

export type Connection = 'connecting' | 'live' | 'off';

type PartyLiveValue = {
  state: PartyState;
  /** Other members' last known positions, keyed by user id. */
  peers: Record<string, Peer>;
  connection: Connection;
};

const PartyLiveContext = React.createContext<PartyLiveValue>({
  state: { status: 'loading' },
  peers: {},
  connection: 'off',
});

const MIN_INTERVAL_MS = 2000;
const MIN_MOVE_M = 5;

/** Loads a party and, while it's live and you're in it, shares your position with the other members. */
export function PartyLiveProvider({ partyId, children }: { partyId: string; children: React.ReactNode }) {
  const { state } = useParty(partyId);
  const { profile } = useAuth();
  const { location } = useLocation();
  const [peers, setPeers] = React.useState<Record<string, Peer>>({});
  const [connection, setConnection] = React.useState<Connection>('off');
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const lastSent = React.useRef<LivePayload | null>(null);

  const userId = profile?.id;
  const sharing =
    state.status === 'ready' &&
    !state.party.endedAt &&
    state.members.some((m) => m.userId === userId && !m.leftAt);

  const coords = location.status === 'ready' ? location.coords : null;
  const coordsRef = React.useRef(coords);
  coordsRef.current = coords;

  const publish = React.useCallback((force = false) => {
    const channel = channelRef.current;
    const c = coordsRef.current;
    if (!channel || !c) return;
    const now = Date.now();
    const prev = lastSent.current;
    if (!force && prev) {
      if (now - prev.at < MIN_INTERVAL_MS) return;
      if (distanceM({ latitude: prev.lat, longitude: prev.lng }, c) < MIN_MOVE_M) return;
    }
    const payload: LivePayload = {
      lat: c.latitude,
      lng: c.longitude,
      accuracy: c.accuracy,
      speed: c.speed,
      heading: c.heading,
      at: now,
    };
    lastSent.current = payload;
    channel.track(payload);
  }, []);

  React.useEffect(() => {
    if (!sharing || !userId) return;
    setConnection('connecting');

    const channel = supabase.channel(`party:${partyId}`, {
      config: { private: true, presence: { key: userId, enabled: true } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const present = channel.presenceState<LivePayload>();
      setPeers((prev) => {
        const next: Record<string, Peer> = {};
        for (const [id, peer] of Object.entries(prev)) next[id] = { ...peer, online: false };
        for (const [id, metas] of Object.entries(present)) {
          const latest = metas[metas.length - 1];
          if (id !== userId && latest) {
            next[id] = { userId: id, lat: latest.lat, lng: latest.lng, accuracy: latest.accuracy, speed: latest.speed, heading: latest.heading, at: latest.at, online: true };
          }
        }
        return next;
      });
    });

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
        setConnection('live');
        publish(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[party-live] ${status}`, err?.message ?? '');
        setConnection('off');
      }
    });

    return () => {
      channelRef.current = null;
      lastSent.current = null;
      channel.untrack();
      supabase.removeChannel(channel);
      setConnection('off');
    };
  }, [partyId, sharing, userId, publish]);

  React.useEffect(() => {
    publish();
  }, [coords?.latitude, coords?.longitude, publish]);

  // Members who've left shouldn't linger on the map.
  const activeIds = state.status === 'ready' ? state.members.filter((m) => !m.leftAt).map((m) => m.userId) : [];
  const visiblePeers = React.useMemo(() => {
    const out: Record<string, Peer> = {};
    for (const id of activeIds) if (peers[id]) out[id] = peers[id];
    return out;
  }, [peers, activeIds.join(',')]);

  const value = React.useMemo(
    () => ({ state, peers: visiblePeers, connection }),
    [state, visiblePeers, connection]
  );
  return <PartyLiveContext.Provider value={value}>{children}</PartyLiveContext.Provider>;
}

export function usePartyLive() {
  return React.useContext(PartyLiveContext);
}
