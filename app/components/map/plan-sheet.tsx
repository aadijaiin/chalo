import { PIN_COLORS } from '@/components/map/pin-marker';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatKm } from '@/lib/format';
import { distanceM } from '@/lib/location';
import { motion } from '@/lib/motion';
import { PIN_META, type Pin } from '@/lib/pins';
import type { Place } from '@/lib/places';
import { THEME } from '@/lib/theme';
import type { Destination } from '@/lib/trip';
import { cn } from '@/lib/utils';
import { Flag, Hand, MapPin, Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Everything on the party map in one list: the destination, then pins nearest first. */
export function PlanSheet({
  destination,
  pins,
  me,
  addedBy,
  canAdd,
  onPickDestination,
  onPickPin,
  onPickPlace,
  onClose,
}: {
  destination: Destination | null;
  pins: Pin[];
  me: { latitude: number; longitude: number } | null;
  addedBy: (pin: Pin) => string;
  onPickDestination: () => void;
  onPickPin: (pin: Pin) => void;
  /** Whether you can add pins (you're live in the party); hides the search otherwise. */
  canAdd: boolean;
  onPickPlace: (place: Place) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme().colorScheme ?? 'light';
  const [query, setQuery] = React.useState('');
  const search = usePlaceSearch(query, me);
  const away = (lat: number, lng: number) =>
    me ? distanceM(me, { latitude: lat, longitude: lng }) : null;
  const sorted = [...pins].sort((a, b) => (away(a.lat, a.lng) ?? 0) - (away(b.lat, b.lng) ?? 0));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={motion.fade()}
        exiting={FadeOut.duration(150)}
        style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          className="bg-black/30"
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85%' }}>
        <Animated.View
          entering={motion.sheetIn}
          exiting={motion.sheetOut}
          style={{ paddingBottom: insets.bottom + 12 }}
          className="gap-3 rounded-t-3xl bg-card pt-3 shadow-xl shadow-black/20">
          <View className="h-1 w-10 self-center rounded-full bg-border" />
          <View className="gap-0.5 px-5">
            <Text className="text-lg font-bold">The plan</Text>
            <Text className="text-xs text-muted-foreground">
              Search for a place, or long-press anywhere on the map to drop a pin for the crew.
            </Text>
          </View>
          {canAdd ? (
            <View className="mx-5 h-11 flex-row items-center gap-2 rounded-full border border-border bg-background px-4">
              <Icon as={Search} size={16} className="text-muted-foreground" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search for a place to add"
                placeholderTextColor={THEME[scheme].mutedForeground}
                returnKeyType="search"
                autoCorrect={false}
                className="flex-1 font-sans text-base text-foreground"
              />
              {search.searching ? (
                <ActivityIndicator size="small" color={THEME[scheme].mutedForeground} />
              ) : query ? (
                <PressableScale
                  onPress={() => setQuery('')}
                  accessibilityLabel="Clear search"
                  hitSlop={8}>
                  <Icon as={X} size={16} className="text-muted-foreground" />
                </PressableScale>
              ) : null}
            </View>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-2 px-5 pb-2">
            {search.active ? (
              search.results.length === 0 && !search.searching ? (
                <Text className="py-4 text-center text-sm text-muted-foreground">
                  No places found. Try another name.
                </Text>
              ) : (
                search.results.map((place) => (
                  <Row
                    key={place.id}
                    icon={MapPin}
                    color={THEME[scheme].mutedForeground}
                    kind="Add to the plan"
                    name={place.name}
                    detail={[fmt(away(place.lat, place.lng)), place.detail]
                      .filter(Boolean)
                      .join(' · ')}
                    onPress={() => onPickPlace(place)}
                  />
                ))
              )
            ) : (
              <>
                {destination ? (
                  <Row
                    icon={Flag}
                    color="hsl(10 70% 62%)"
                    kind="Destination"
                    name={destination.name}
                    detail={fmt(away(destination.lat, destination.lng))}
                    onPress={onPickDestination}
                  />
                ) : null}
                {sorted.map((p) => (
                  <Row
                    key={p.id}
                    icon={PIN_META[p.kind].icon}
                    color={PIN_COLORS[p.kind]}
                    kind={PIN_META[p.kind].label}
                    name={p.name}
                    detail={[fmt(away(p.lat, p.lng)), `by ${addedBy(p)}`]
                      .filter(Boolean)
                      .join(' · ')}
                    onPress={() => onPickPin(p)}
                  />
                ))}
                {!destination && pins.length === 0 ? (
                  <View className="items-center gap-2 rounded-2xl border border-dashed border-border p-6">
                    <Icon as={Hand} size={22} className="text-muted-foreground" />
                    <Text className="text-center text-sm text-muted-foreground">
                      Nothing planned yet. Search above, or long-press the map, to add a stop or a
                      meetup point.
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function fmt(m: number | null) {
  return m == null ? '' : `${formatKm(m)} away`;
}

function Row({
  icon,
  color,
  kind,
  name,
  detail,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['as'];
  color: string;
  kind: string;
  name: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border border-border bg-background p-3'
      )}>
      <View className="rounded-xl p-2.5" style={{ backgroundColor: color }}>
        <Icon as={icon} size={16} className="text-white" />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] uppercase tracking-wider font-semibold" style={{ color }}>
          {kind}
        </Text>
        <Text className="font-semibold" numberOfLines={1}>
          {name}
        </Text>
        {detail ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}
