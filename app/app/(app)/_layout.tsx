import { SplashLoader } from '@/components/splash-loader';
import { useAuth } from '@/lib/auth';
import { LocationProvider } from '@/lib/location';
import { listenForTaps, registerForPush } from '@/lib/push';
import { SharingProvider } from '@/lib/sharing';
import { Redirect, Stack } from 'expo-router';
import * as React from 'react';

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const userId = session?.user.id;

  // Quietly refresh this device's push token on sign-in; the prompt itself waits until you join a party.
  React.useEffect(() => {
    if (userId) registerForPush(false);
  }, [userId]);
  React.useEffect(() => (userId ? listenForTaps() : undefined), [userId]);

  // A cold start from an invite link or a notification lands here without passing the gate, so
  // wait for the stored session instead of bouncing to login and losing where it was going.
  if (isLoading) return <SplashLoader />;
  if (!session) return <Redirect href="/login" />;
  return (
    <LocationProvider>
      <SharingProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="map" />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="party/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="party/[id]" />
          <Stack.Screen name="join/[code]" options={{ animation: 'fade' }} />
        </Stack>
      </SharingProvider>
    </LocationProvider>
  );
}
