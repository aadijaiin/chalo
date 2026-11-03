import { SplashLoader } from '@/components/splash-loader';
import { notify } from '@/lib/notify';
import { usePartyActions } from '@/hooks/use-party-actions';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

/**
 * Target of invite links (chalo://join/ABC234): joins, then hands off to the lobby.
 * Lookout links (chalo://join/ABC234?as=lookout) follow the party without sharing.
 */
export default function JoinFromLink() {
  const { code, as } = useLocalSearchParams<{ code: string; as?: string }>();
  const actions = usePartyActions();

  React.useEffect(() => {
    actions
      .join(code, { asLookout: as === 'lookout' })
      .then((party) => {
        if (!party) return router.replace('/home');
        const lobby = { pathname: '/party/[id]', params: { id: party.id } } as const;
        // Back to the party if its screens are already open underneath, rather than a second
        // copy. Opened cold, this is the only screen, so there's nothing to go back to.
        if (router.canDismiss()) router.dismissTo(lobby);
        else router.replace(lobby);
      })
      .catch((e: Error) => {
        notify.error("Couldn't join", e.message);
        router.replace('/home');
      });
  }, [code, as]);

  return <SplashLoader />;
}
