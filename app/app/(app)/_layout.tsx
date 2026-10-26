import { useAuth } from '@/lib/auth';
import { LocationProvider } from '@/lib/location';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/login" />;
  return (
    <LocationProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="map" />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="party/new" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="party/[id]" />
        <Stack.Screen name="join/[code]" options={{ animation: 'fade' }} />
      </Stack>
    </LocationProvider>
  );
}
