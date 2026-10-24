import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/location';
import { MAP_STYLE } from '@/lib/theme';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ChevronLeft, LocateFixed, MapPinOff } from 'lucide-react-native';
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

  const coords = location.status === 'ready' ? location.coords : null;
  const lngLat = coords ? ([coords.longitude, coords.latitude] as [number, number]) : null;

  // Fly in once on the first fix; after that the user is free to pan around.
  React.useEffect(() => {
    if (lngLat && styleLoaded && !hasCentered.current) {
      hasCentered.current = true;
      cameraRef.current?.flyTo({ center: lngLat, zoom: FOLLOW_ZOOM, duration: 1200 });
    }
  }, [lngLat, styleLoaded]);

  function recenter() {
    if (!lngLat) return;
    cameraRef.current?.flyTo({ center: lngLat, zoom: FOLLOW_ZOOM, duration: 900 });
  }

  return (
    <View className="flex-1 bg-background">
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        androidView="texture"
        logo={false}
        compass={false}
        attributionPosition={{ bottom: insets.bottom + 120, left: 12 }}
        onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
        <Camera
          ref={cameraRef}
          initialViewState={lngLat ? { center: lngLat, zoom: FOLLOW_ZOOM } : { center: [78.9629, 22.5937], zoom: 3.5 }}
        />
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
        <Animated.View entering={FadeIn.delay(300)} style={{ bottom: insets.bottom + 124 }} className="absolute right-4">
          <PressableScale
            onPress={recenter}
            accessibilityLabel="Center on my location"
            className="h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={LocateFixed} size={20} className="text-primary" />
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
                  <Text className="text-xs text-muted-foreground">chalo needs it to put you on the map.</Text>
                </View>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    location.status === 'denied' && !location.canAskAgain ? Linking.openSettings() : retry()
                  }>
                  <Text>Enable</Text>
                </Button>
              </View>
            ) : coords ? (
              <Animated.View entering={FadeIn.duration(300)} className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-sage" />
                  <Text className="text-xs font-semibold uppercase tracking-widest text-sage">Live</Text>
                </View>
                <Text className="text-lg font-bold" numberOfLines={1}>
                  {place ?? "You're on the map"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  {coords.accuracy ? `  ·  ±${Math.round(coords.accuracy)} m` : ''}
                  {coords.speed && coords.speed > 0 ? `  ·  ${Math.round(coords.speed * 3.6)} km/h` : ''}
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
