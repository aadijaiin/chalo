import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { AvatarConfig } from '@/lib/avatar';
import { useLocation } from '@/lib/location';
import { MAP_STYLE } from '@/lib/theme';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { Expand, MapPinOff } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/** A glanceable, non-interactive preview of where you are. Tap to open the full map. */
export function LiveLocationCard({ avatar, onOpen }: { avatar: AvatarConfig; onOpen: () => void }) {
  const { colorScheme } = useColorScheme();
  const { location, place, retry } = useLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const coords = location.status === 'ready' ? location.coords : null;
  const lngLat = coords ? ([coords.longitude, coords.latitude] as [number, number]) : null;

  React.useEffect(() => {
    if (lngLat && mapReady) cameraRef.current?.easeTo({ center: lngLat, zoom: 15, duration: 600 });
  }, [lngLat?.[0], lngLat?.[1], mapReady]);

  if (location.status === 'denied' || location.status === 'error') {
    const settings = location.status === 'denied' && !location.canAskAgain;
    return (
      <PressableScale
        onPress={() => (settings ? Linking.openSettings() : retry())}
        className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-5">
        <View className="rounded-2xl bg-primary/10 p-3">
          <Icon as={MapPinOff} size={22} className="text-primary" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-bold">Location is off</Text>
          <Text className="text-xs text-muted-foreground">
            {settings ? 'Tap to enable it in Settings.' : 'Tap to allow location access.'}
          </Text>
        </View>
      </PressableScale>
    );
  }

  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card">
      <View className="h-44">
        {lngLat ? (
          <Map
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE[colorScheme ?? 'light']}
            androidView="texture"
            logo={false}
            compass={false}
            attribution={false}
            dragPan={false}
            touchZoom={false}
            doubleTapZoom={false}
            doubleTapHoldZoom={false}
            touchRotate={false}
            touchPitch={false}
            onDidFinishLoadingStyle={() => setMapReady(true)}>
            <Camera ref={cameraRef} initialViewState={{ center: lngLat, zoom: 15 }} />
            <Marker id="me-preview" lngLat={lngLat} anchor="center">
              <UserMarker avatar={avatar} size={36} />
            </Marker>
          </Map>
        ) : null}
        {!mapReady ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
        {/* Swallow touches so the whole card acts as one button. */}
        <PressableScale
          onPress={onOpen}
          scaleTo={1}
          accessibilityLabel="Open live map"
          className="absolute inset-0 items-end p-3">
          <View className="rounded-full bg-card/90 p-2">
            <Icon as={Expand} size={16} />
          </View>
        </PressableScale>
      </View>

      <PressableScale onPress={onOpen} scaleTo={0.99} className="gap-1 p-4">
        {coords ? (
          <Animated.View entering={FadeIn.duration(300)} className="gap-1">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-sage" />
              <Text className="text-xs font-semibold uppercase tracking-widest text-sage">Live</Text>
            </View>
            <Text className="text-base font-bold" numberOfLines={1}>
              {place ?? 'Your location'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              ±{Math.round(coords.accuracy ?? 0)} m accuracy · tap to open map
            </Text>
          </Animated.View>
        ) : (
          <View className="gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-36" />
          </View>
        )}
      </PressableScale>
    </View>
  );
}
