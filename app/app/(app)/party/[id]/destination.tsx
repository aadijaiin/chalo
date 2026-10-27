import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { useLocation } from '@/lib/location';
import { motion } from '@/lib/motion';
import { notify } from '@/lib/notify';
import { parties } from '@/lib/parties';
import { usePartyLive } from '@/lib/party-live';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { nameForPoint, type Place } from '@/lib/places';
import { MAP_STYLE, THEME } from '@/lib/theme';
import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { ChevronLeft, Flag, MapPin, Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Spot = { name: string | null; lat: number; lng: number };

const PICK_ZOOM = 15;

/** Host picks where the party is headed: search for a place, or move the map under the pin. */
export default function DestinationPicker() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme().colorScheme ?? 'light';
  const { state } = usePartyLive();
  const { location } = useLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const party = state.status === 'ready' ? state.party : null;
  const current = party?.destination ?? null;
  const me = location.status === 'ready' ? location.coords : null;

  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [pick, setPick] = React.useState<Spot | null>(current);
  const [naming, setNaming] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [saving, setSaving] = React.useState<'set' | 'clear' | null>(null);
  // A search result flies the map there; that move shouldn't rename the pick.
  const flyingToResult = React.useRef(false);

  const { results, searching } = usePlaceSearch(query, me);

  function choose(place: Place) {
    haptics.select();
    Keyboard.dismiss();
    setFocused(false);
    setQuery('');
    setPick({ name: place.name, lat: place.lat, lng: place.lng });
    flyingToResult.current = true;
    cameraRef.current?.flyTo({ center: [place.lng, place.lat], zoom: PICK_ZOOM, duration: 900 });
  }

  async function onMoved(center: [number, number], byUser: boolean) {
    setDragging(false);
    if (flyingToResult.current) {
      flyingToResult.current = false;
      return;
    }
    if (!byUser) return;
    const [lng, lat] = center;
    setPick({ name: null, lat, lng });
    setNaming(true);
    const name = await nameForPoint(lat, lng);
    setPick((p) => (p && p.lat === lat && p.lng === lng ? { ...p, name: name ?? 'Dropped pin' } : p));
    setNaming(false);
  }

  async function save(clear: boolean) {
    if (!party) return;
    setSaving(clear ? 'clear' : 'set');
    try {
      await parties.setDestination(party.id, clear || !pick ? null : { name: pick.name ?? 'Dropped pin', lat: pick.lat, lng: pick.lng });
      haptics.success();
      router.back();
    } catch (e) {
      notify.error("Couldn't save the destination", (e as Error).message);
      setSaving(null);
    }
  }

  const pinLift = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(dragging ? -10 : 0, { duration: 160 }) }],
  }));

  const start = current ? [current.lng, current.lat] : me ? [me.longitude, me.latitude] : null;
  const showResults = focused && query.trim().length >= 2;

  return (
    <View className="flex-1 bg-background">
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        androidView="texture"
        logo={false}
        compass={false}
        attributionPosition={{ bottom: insets.bottom + 180, left: 12 }}
        onRegionWillChange={(e) => e.nativeEvent.userInteraction && setDragging(true)}
        onRegionDidChange={(e) => onMoved(e.nativeEvent.center as [number, number], e.nativeEvent.userInteraction)}>
        <Camera
          ref={cameraRef}
          initialViewState={
            start ? { center: start as [number, number], zoom: PICK_ZOOM } : { center: [78.9629, 22.5937], zoom: 3.5 }
          }
        />
      </Map>

      {/* The pin stays put in the middle; the map moves under it. Its tip marks the spot. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center justify-center">
        <Animated.View style={[pinLift, { marginBottom: 44 }]} className="items-center">
          <View className="rounded-full bg-primary p-2.5 shadow-lg shadow-black/30">
            <Icon as={Flag} size={20} className="text-primary-foreground" />
          </View>
          <View className="-mt-[5px] h-3 w-3 rotate-45 bg-primary" style={{ borderBottomRightRadius: 2 }} />
        </Animated.View>
        <View className="absolute h-2 w-2 rounded-full bg-foreground/40" />
      </View>

      <View style={{ top: insets.top + 8 }} className="absolute left-4 right-4 gap-2">
        <View className="flex-row items-center gap-3">
          <PressableScale
            onPress={() => router.back()}
            accessibilityLabel="Back"
            className="h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={ChevronLeft} size={22} />
          </PressableScale>
          <View className="h-11 flex-1 flex-row items-center gap-2 rounded-full bg-card px-4 shadow-lg shadow-black/20">
            <Icon as={Search} size={16} className="text-muted-foreground" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              placeholder="Search for a place"
              placeholderTextColor={THEME[scheme].mutedForeground}
              returnKeyType="search"
              autoCorrect={false}
              className="flex-1 font-sans text-base text-foreground"
            />
            {searching ? (
              <ActivityIndicator size="small" color={THEME[scheme].mutedForeground} />
            ) : query ? (
              <PressableScale onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                <Icon as={X} size={16} className="text-muted-foreground" />
              </PressableScale>
            ) : null}
          </View>
        </View>

        {showResults ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="max-h-80 overflow-hidden rounded-3xl bg-card shadow-xl shadow-black/15">
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.length === 0 && !searching ? (
                <Text className="p-4 text-sm text-muted-foreground">No places found. Try another name.</Text>
              ) : (
                results.map((r, i) => (
                  <PressableScale
                    key={r.id}
                    onPress={() => choose(r)}
                    scaleTo={0.99}
                    className={i > 0 ? 'flex-row items-center gap-3 border-t border-border px-4 py-3' : 'flex-row items-center gap-3 px-4 py-3'}>
                    <Icon as={MapPin} size={16} className="text-primary" />
                    <View className="flex-1">
                      <Text className="font-semibold" numberOfLines={1}>
                        {r.name}
                      </Text>
                      {r.detail ? (
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {r.detail}
                        </Text>
                      ) : null}
                    </View>
                  </PressableScale>
                ))
              )}
            </ScrollView>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View
        entering={motion.sheetIn}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-3xl bg-card px-5 pt-5 shadow-xl shadow-black/15">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Destination</Text>
          {pick ? (
            <Text className="text-lg font-bold" numberOfLines={2}>
              {naming || !pick.name ? 'Finding this spot…' : pick.name}
            </Text>
          ) : (
            <Text className="text-lg font-bold">Search, or move the map to the spot</Text>
          )}
          <Text className="text-xs text-muted-foreground">Everyone gets their route and ETA to it.</Text>
        </View>
        <Button size="lg" loading={saving === 'set'} disabled={!pick || naming || saving !== null} onPress={() => save(false)}>
          <Icon as={Flag} size={18} className="text-primary-foreground" />
          <Text>{current ? 'Change destination' : 'Set destination'}</Text>
        </Button>
        {current ? (
          <Button variant="ghost" loading={saving === 'clear'} disabled={saving !== null} onPress={() => save(true)}>
            <Text className="text-destructive">Remove destination</Text>
          </Button>
        ) : null}
      </Animated.View>
    </View>
  );
}
