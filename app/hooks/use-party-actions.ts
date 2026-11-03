import { confirm } from '@/lib/confirm';
import { notify } from '@/lib/notify';
import { PartyConflictError, parties, type Party } from '@/lib/parties';
import { useSharing } from '@/lib/sharing';
import { EyeOff, LogOut, Repeat } from 'lucide-react-native';
import * as React from 'react';

/** Create, join, leave and end, with the one-live-party rule and location sharing wired in. */
export function usePartyActions() {
  const sharing = useSharing();

  // Runs `attempt`; if you're already live elsewhere, asks before replacing that party.
  const withConflictCheck = React.useCallback(
    async (verb: 'start' | 'join', attempt: (replace: boolean) => Promise<Party>) => {
      try {
        return await attempt(false);
      } catch (e) {
        if (!(e instanceof PartyConflictError)) throw e;
        const host = e.role === 'host';
        const ok = await confirm({
          icon: Repeat,
          title: `You're already in ${e.partyName}`,
          message: host
            ? `You can only be in one live party at a time. To ${verb} this one, ${e.partyName} will end for everyone in it.`
            : `You can only be in one live party at a time. To ${verb} this one, you'll leave ${e.partyName}.`,
          confirmLabel: host ? `End ${e.partyName} & ${verb}` : `Leave & ${verb}`,
          destructive: true,
        });
        if (!ok) return null;
        return attempt(true);
      }
    },
    []
  );

  const create = React.useCallback(
    async (name: string) => {
      const party = await withConflictCheck('start', (replace) => parties.create(name, replace));
      if (party) await sharing.start(party);
      return party;
    },
    [withConflictCheck, sharing.start]
  );

  /** A lookout follows the party without sharing, so the one-live-party rule doesn't apply. */
  const join = React.useCallback(
    async (code: string, opts: { asLookout?: boolean } = {}) => {
      if (opts.asLookout) {
        const party = await parties.join(code, false, true);
        // Switching from crew to lookout in the same party: your position comes off the map.
        if (sharing.target?.id === party.id) await sharing.stop();
        return party;
      }
      const party = await withConflictCheck('join', (replace) => parties.join(code, replace));
      if (party) await sharing.start(party);
      return party;
    },
    [withConflictCheck, sharing.start, sharing.stop, sharing.target?.id]
  );

  /** Lookouts just stop watching; nothing of theirs was being shared. */
  const stopWatching = React.useCallback(async (party: Party) => {
    const ok = await confirm({
      icon: EyeOff,
      title: `Stop watching ${party.name}?`,
      message: 'You won’t see the crew or get their alerts any more. You can follow again with the same link while it’s live.',
      confirmLabel: 'Stop watching',
      destructive: true,
    });
    if (!ok) return false;
    try {
      await parties.leave(party.id);
      notify.success('Stopped watching', party.name);
      return true;
    } catch (e) {
      notify.error("Couldn't stop watching", (e as Error).message);
      return false;
    }
  }, []);

  /** Asks first; resolves true once you're out. */
  const exit = React.useCallback(
    async (party: Party, isHost: boolean) => {
      const ok = await confirm({
        icon: LogOut,
        title: isHost ? 'End this party?' : 'Leave this party?',
        message: isHost
          ? 'Everyone stops sharing their location and the code stops working.'
          : 'You stop sharing your location. You can rejoin with the same code while it’s live.',
        confirmLabel: isHost ? 'End party' : 'Leave party',
        destructive: true,
      });
      if (!ok) return false;
      try {
        if (isHost) await parties.end(party.id);
        else await parties.leave(party.id);
        await sharing.stop();
        notify.success(isHost ? 'Party ended' : 'You left the party', 'Location sharing is off.');
        return true;
      } catch (e) {
        notify.error(isHost ? "Couldn't end the party" : "Couldn't leave", (e as Error).message);
        return false;
      }
    },
    [sharing.stop]
  );

  return { create, join, exit, stopWatching };
}
