import { PartyLiveProvider } from '@/lib/party-live';
import { Stack, useLocalSearchParams } from 'expo-router';

/** Lobby and map share one party subscription and one live-location channel. */
export default function PartyLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PartyLiveProvider partyId={id}>
      <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="map" options={{ animation: 'fade' }} />
        <Stack.Screen name="destination" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recap" />
      </Stack>
    </PartyLiveProvider>
  );
}
