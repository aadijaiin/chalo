import { SplashLoader } from '@/components/splash-loader';
import { useAuth } from '@/lib/auth';
import { preferences } from '@/lib/preferences';
import { Redirect } from 'expo-router';
import * as React from 'react';

/** Decides where a cold start lands: map, onboarding, or sign in. */
export default function Gate() {
  const { session, isLoading } = useAuth();
  const [onboarded, setOnboarded] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    preferences.hasOnboarded().then(setOnboarded);
  }, []);

  if (isLoading || onboarded === null) return <SplashLoader />;
  if (session) return <Redirect href="/map" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/login" />;
}
