import { parties, type Party, type PartyMember } from '@/lib/parties';
import { supabase } from '@/lib/supabase';
import * as React from 'react';

export type PartyState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; party: Party; members: PartyMember[] };

/** Loads a party and its roster, then keeps both fresh over Supabase Realtime. */
export function useParty(partyId: string) {
  const [state, setState] = React.useState<PartyState>({ status: 'loading' });

  const load = React.useCallback(async () => {
    try {
      const [party, members] = await Promise.all([parties.get(partyId), parties.members(partyId)]);
      setState(party ? { status: 'ready', party, members } : { status: 'missing' });
    } catch (e) {
      setState((s) => (s.status === 'ready' ? s : { status: 'error', message: (e as Error).message }));
    }
  }, [partyId]);

  React.useEffect(() => {
    load();
    // Change payloads don't carry joined profile data, so any change just triggers a refetch.
    const channel = supabase
      .channel(`party-lobby:${partyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, load]);

  return { state, reload: load };
}
