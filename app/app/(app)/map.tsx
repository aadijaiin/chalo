import { AvatarView } from '@/components/avatar-view';
import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useLiveLocation } from '@/hooks/use-live-location';
import { useAuth } from '@/lib/auth';
import { MAP_STYLE } from '@/lib/theme';
import { useThemePreference } from '@/lib/theme-preference';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { LocateFixed, MapPinOff, Moon, Plus, Sun, UsersRound } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const FOLLOW_ZOOM = 16;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const { setPreference } = useThemePreference();
  const { location, retry } = useLiveLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const [styleLoaded, setStyleLoaded] = React.useState(false);
  const hasCentered = React.useRef(false);

  const coords = location.status === 'ready' ? location.coords : null;
  const lngLat = coords ? ([coords.longitude, coords.latitude] as [number, number]) : null;

  // Fly in once on the first fix; after that the user is free to pan around.
  React.useEffect(() => {
    if (lngLat && styleLoaded && !hasCentered.current) {
      hasCentered.current = true;
      cameraRef.current?.flyTo({ center: lngLat, zoom: FOLLOW_ZOOM, duration: 1600 });
    }
  }, [lngLat, styleLoaded]);

  function recenter() {
    if (!lngLat) return;
    cameraRef.current?.flyTo({ center: lngLat, zoom: FOLLOW_ZOOM, duration: 900 });
  }

  const firstName = profile?.fullName.split(' ')[0] || profile?.username || 'there';

  return (
    <View className="flex-1 bg-background">
      <Map
        key={scheme}
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        logo={false}
        compass={false}
        attributionPosition={{ bottom: insets.bottom + 196, left: 12 }}
        onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
        <Camera ref={cameraRef} initialViewState={{ center: [78.9629, 22.5937], zoom: 3.5 }} />
        {lngLat && profile ? (
          <Marker id="me" lngLat={lngLat} anchor="center">
            <UserMarker avatar={profile.avatar} />
          </Marker>
        ) : null}
      </Map>

      {!styleLoaded ? (
        <Animated.View exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFill} className="bg-background">
          <Skeleton className="flex-1 rounded-none opacity-60" />
        </Animated.View>
      ) : null}

      {/* Top bar */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 right-4">
        <GlassCard className="flex-row items-center gap-3 p-2 pr-3">
          <PressableScale onPress={() => router.push('/profile')} accessibilityLabel="Open profile">
            {profile ? (
              <AvatarView avatar={profile.avatar} size={44} />
            ) : (
              <Skeleton className="h-11 w-11 rounded-full" />
            )}
          </PressableScale>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Hey {firstName} 👋</Text>
            <Text className="text-base font-bold">Ready to roll?</Text>
          </View>
          <PressableScale
            onPress={() => setPreference(scheme === 'dark' ? 'light' : 'dark')}
            accessibilityLabel="Toggle theme"
            className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon as={scheme === 'dark' ? Sun : Moon} size={18} />
          </PressableScale>
        </GlassCard>
      </Animated.View>

      {/* Recenter */}
      {lngLat ? (
        <Animated.View
          entering={FadeIn.delay(300)}
          style={{ bottom: insets.bottom + 200 }}
          className="absolute right-4">
          <PressableScale
            onPress={recenter}
            accessibilityLabel="Center on my location"
            className="h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={LocateFixed} size={20} className="text-primary" />
          </PressableScale>
        </Animated.View>
      ) : null}

      {/* Bottom sheet */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(150)}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 px-4">
        <GlassCard className="gap-4 p-4">
          {location.status === 'denied' || location.status === 'error' ? (
            <PermissionPrompt
              message={
                location.status === 'error'
                  ? location.message
                  : 'chalo needs your location to show you on the map.'
              }
              onPress={() => (location.status === 'denied' && !location.canAskAgain ? Linking.openSettings() : retry())}
              actionLabel={location.status === 'denied' && !location.canAskAgain ? 'Open settings' : 'Try again'}
            />
          ) : (
            <LocationSummary coords={coords} />
          )}
          <View className="flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              onPress={() => toast('Parties are coming in the next build', { description: 'Hang tight!' })}>
              <Icon as={Plus} size={18} />
              <Text>Create party</Text>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onPress={() => toast('Parties are coming in the next build', { description: 'Hang tight!' })}>
              <Icon as={UsersRound} size={18} />
              <Text>Join</Text>
            </Button>
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  return (
    <View className="overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-black/10">
      <BlurView
        intensity={60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 bg-card/75" />
      <View className={className}>{children}</View>
    </View>
  );
}

function LocationSummary({ coords }: { coords: { latitude: number; longitude: number; accuracy: number | null; speed: number | null } | null }) {
  if (!coords) {
    return (
      <View className="gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3 w-40" />
      </View>
    );
  }
  const speedKmh = coords.speed && coords.speed > 0 ? Math.round(coords.speed * 3.6) : 0;
  return (
    <Animated.View entering={FadeIn.duration(300)} className="gap-1">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-sage" />
        <Text className="text-xs font-semibold uppercase tracking-widest text-sage">Live</Text>
      </View>
      <Text className="text-lg font-bold">You're on the map</Text>
      <Text className="text-xs text-muted-foreground">
        {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
        {coords.accuracy ? `  ·  ±${Math.round(coords.accuracy)} m` : ''}
        {speedKmh ? `  ·  ${speedKmh} km/h` : ''}
      </Text>
    </Animated.View>
  );
}

function PermissionPrompt({
  message,
  actionLabel,
  onPress,
}: {
  message: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="rounded-2xl bg-primary/10 p-3">
        <Icon as={MapPinOff} size={22} className="text-primary" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold">Location is off</Text>
        <Text className="text-xs text-muted-foreground">{message}</Text>
      </View>
      <Button size="sm" variant="secondary" onPress={onPress}>
        <Text>{actionLabel}</Text>
      </Button>
    </View>
  );
}
