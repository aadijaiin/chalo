import { useAuth } from '@/lib/auth';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="map" />
      <Stack.Screen name="profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
