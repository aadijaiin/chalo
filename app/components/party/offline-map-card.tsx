import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { useOfflineRoute } from '@/lib/offline-maps';
import type { LngLat } from '@/lib/routing';
import { MAP_STYLE } from '@/lib/theme';
import { CloudDownload, CloudOff, WifiOff } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/** Save the map along your route, so it still works where the signal drops out. */
export function OfflineMapCard({ partyId, route }: { partyId: string; route: LngLat[] | null }) {
  const scheme = useColorScheme().colorScheme ?? 'light';
  const { state, download, remove } = useOfflineRoute();
  const percent = state.status === 'downloading' ? state.percent : 0;
  const bar = useAnimatedStyle(() => ({ width: withTiming(`${Math.max(4, percent)}%`, { duration: 300 }) }));
  const savedHere = state.status === 'ready' && state.partyId === partyId;

  function save() {
    if (!route) return;
    haptics.select();
    download(partyId, route, MAP_STYLE[scheme]);
  }

  return (
    <View className="gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="rounded-2xl bg-muted p-2.5">
          <Icon as={savedHere ? WifiOff : CloudDownload} size={18} className="text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold">
            {savedHere ? 'Map saved for offline' : state.status === 'downloading' ? 'Saving the map…' : 'Map for no-signal areas'}
          </Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            {savedHere
              ? `Your route is on this phone (${state.sizeMb.toFixed(0)} MB). The map keeps working without signal.`
              : state.status === 'downloading'
                ? `${Math.round(percent)}% · keep chalo open until it's done`
                : state.status === 'error'
                  ? `Couldn't save it: ${state.message}`
                  : route
                    ? 'Save the map along your route before you lose signal in the hills.'
                    : 'Once your route to the destination is ready, you can save it here.'}
          </Text>
        </View>
        {savedHere ? (
          <PressableScale onPress={remove} accessibilityLabel="Remove offline map" className="rounded-full bg-muted p-2.5">
            <Icon as={CloudOff} size={16} className="text-muted-foreground" />
          </PressableScale>
        ) : state.status !== 'downloading' ? (
          <Button size="sm" disabled={!route} onPress={save} className="rounded-full px-4">
            <Text>Save</Text>
          </Button>
        ) : null}
      </View>
      {state.status === 'downloading' ? (
        <Animated.View entering={FadeIn} className="h-1.5 overflow-hidden rounded-full bg-muted">
          <Animated.View style={bar} className="h-full rounded-full bg-primary" />
        </Animated.View>
      ) : null}
    </View>
  );
}
