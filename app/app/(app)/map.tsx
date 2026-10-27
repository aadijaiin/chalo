import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useFollowCamera, type FollowMode } from '@/hooks/use-follow-camera';
import { useHideDevTools } from '@/hooks/use-hide-dev-tools';
import { useAuth } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLocation } from '@/lib/location';
import { MAP_STYLE } from '@/lib/theme';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ChevronLeft, LocateFixed, MapPinOff, Navigation } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FOLLOW_ZOOM = 16;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const { location, retry, place } = useLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const [styleLoaded, setStyleLoaded] = React.useState(false);
  const hasCentered = React.useRef(false);
  // Off, keep you centred, or centred and turned to your direction of travel.
  const [follow, setFollow] = React.useState<FollowMode>('off');
  useHideDevTools();

  const coords = location.status === 'ready' ? location.coords : null;
  const lngLat = coords ? ([coords.longitude, coords.latitude] as [number, number]) : null;

  // Fly in once on the first fix; after that the user is free to pan around.
  React.useEffect(() => {
    if (lngLat && styleLoaded && !hasCentered.current) {
      hasCentered.current = true;
      cameraRef.current?.flyTo({ center: lngLat, zoom: FOLLOW_ZOOM, duration: 1200 });
    }
  }, [lngLat, styleLoaded]);

  useFollowCamera(cameraRef, follow, coords, { top: insets.top + 60, bottom: insets.bottom + 110 });

  /** The locate button: start following, then turn heading-up, then stop and face north. */
  function cycleFollow() {
    if (!lngLat) return;
    haptics.select();
    const next: FollowMode = follow === 'off' ? 'follow' : follow === 'follow' ? 'heading' : 'off';
    setFollow(next);
    if (next === 'off')
      cameraRef.current?.easeTo({ center: lngLat, bearing: 0, pitch: 0, duration: 400 });
  }

  return (
    <View className="flex-1 bg-background">
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        androidView="texture"
        logo={false}
        // Shows only while the map is turned away from north; tap it to face north again.
        compass
        compassPosition={{ top: insets.top + 64, right: 16 }}
        attributionPosition={{ bottom: insets.bottom + 120, left: 12 }}
        onRegionWillChange={(e) => {
          // Dragging or pinching the map means you want to look around, so stop following.
          if (e.nativeEvent.userInteraction && follow !== 'off') setFollow('off');
        }}
        onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
        <Camera
          ref={cameraRef}
          initialViewState={
            lngLat
              ? { center: lngLat, zoom: FOLLOW_ZOOM }
              : { center: [78.9629, 22.5937], zoom: 3.5 }
          }
        />
        {lngLat && profile ? (
          <Marker id="me" lngLat={lngLat} anchor="center">
            <UserMarker avatar={profile.avatar} />
          </Marker>
        ) : null}
      </Map>

      {!styleLoaded ? (
        <Animated.View
          exiting={FadeOut.duration(400)}
          style={StyleSheet.absoluteFill}
          className="bg-background">
          <Skeleton className="flex-1 rounded-none opacity-60" />
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 right-4 flex-row items-center justify-between">
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
          <Icon as={ChevronLeft} size={22} />
        </PressableScale>
        <ThemeToggle className="bg-card shadow-lg shadow-black/20" />
      </Animated.View>

      {lngLat ? (
        <Animated.View
          entering={FadeIn.delay(300)}
          style={{ bottom: insets.bottom + 124 }}
          className="absolute right-4">
          <PressableScale
            onPress={cycleFollow}
            accessibilityLabel={
              follow === 'off'
                ? 'Follow me'
                : follow === 'follow'
                  ? 'Turn map to my direction'
                  : 'Stop following'
            }
            className={cn(
              'h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-black/20',
              follow === 'off' ? 'bg-card' : 'bg-primary'
            )}>
            <Icon
              as={follow === 'heading' ? Navigation : LocateFixed}
              size={20}
              className={follow === 'off' ? 'text-primary' : 'text-primary-foreground'}
            />
          </PressableScale>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInUp.duration(450).delay(100)}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 px-4">
        <View className="overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-black/10">
          <BlurView intensity={60} tint={scheme} style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-card/80" />
          <View className="p-4">
            {location.status === 'denied' || location.status === 'error' ? (
              <View className="flex-row items-center gap-3">
                <View className="rounded-2xl bg-primary/10 p-3">
                  <Icon as={MapPinOff} size={22} className="text-primary" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold">Location is off</Text>
                  <Text className="text-xs text-muted-foreground">
                    chalo needs it to put you on the map.
                  </Text>
                </View>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    location.status === 'denied' && !location.canAskAgain
                      ? Linking.openSettings()
                      : retry()
                  }>
                  <Text>Enable</Text>
                </Button>
              </View>
            ) : coords ? (
              <Animated.View entering={FadeIn.duration(300)} className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-sage" />
                  <Text className="text-xs uppercase tracking-widest text-sage font-semibold">
                    Live
                  </Text>
                </View>
                <Text className="text-lg font-bold" numberOfLines={1}>
                  {place ?? "You're on the map"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  {coords.accuracy ? `  ·  ±${Math.round(coords.accuracy)} m` : ''}
                  {coords.speed && coords.speed > 0
                    ? `  ·  ${Math.round(coords.speed * 3.6)} km/h`
                    : ''}
                </Text>
              </Animated.View>
            ) : (
              <View className="gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-40" />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
