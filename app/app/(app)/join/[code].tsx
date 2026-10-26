import { SplashLoader } from '@/components/splash-loader';
import { notify } from '@/lib/notify';
import { usePartyActions } from '@/hooks/use-party-actions';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

/** Target of invite links (chalo://join/ABC234): joins, then hands off to the lobby. */
export default function JoinFromLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const actions = usePartyActions();

  React.useEffect(() => {
    actions
      .join(code)
      .then((party) =>
        party ? router.replace({ pathname: '/party/[id]', params: { id: party.id } }) : router.replace('/home')
      )
      .catch((e: Error) => {
        notify.error("Couldn't join", e.message);
        router.replace('/home');
      });
  }, [code]);

  return <SplashLoader />;
}
