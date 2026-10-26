import { SplashLoader } from '@/components/splash-loader';
import { notify } from '@/lib/notify';
import { parties } from '@/lib/parties';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

/** Target of invite links (chalo://join/ABC234): joins, then hands off to the lobby. */
export default function JoinFromLink() {
  const { code } = useLocalSearchParams<{ code: string }>();

  React.useEffect(() => {
    parties
      .join(code)
      .then((party) => router.replace({ pathname: '/party/[id]', params: { id: party.id } }))
      .catch((e: Error) => {
        notify.error("Couldn't join", e.message);
        router.replace('/home');
      });
  }, [code]);

  return <SplashLoader />;
}
