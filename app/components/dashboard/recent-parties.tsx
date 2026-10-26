import { AvatarView } from '@/components/avatar-view';
import { LiveDot } from '@/components/live-dot';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { parties, type PartySummary } from '@/lib/parties';
import { useSharing } from '@/lib/sharing';
import { cn } from '@/lib/utils';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Route } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function RecentParties({ userId }: { userId: string }) {
  const [list, setList] = React.useState<PartySummary[] | null>(null);
  const { target } = useSharing();

  // Refetch whenever home regains focus, so creating, joining or leaving shows up right away.
  useFocusEffect(
    React.useCallback(() => {
      parties
        .mine(userId)
        .then(setList)
        .catch(() => setList((l) => l ?? []));
    }, [userId, target?.id])
  );

  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent parties</Text>
      {list === null ? (
        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          {[0, 1].map((i) => (
            <View key={i} className={cn('flex-row items-center gap-3 p-4', i > 0 && 'border-t border-border')}>
              <Skeleton className="h-8 w-8 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </View>
              <Skeleton className="h-6 w-14 rounded-full" />
            </View>
          ))}
        </View>
      ) : list.length === 0 ? (
        <View className="items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-8">
          <View className="rounded-2xl bg-muted p-3">
            <Icon as={Route} size={22} className="text-muted-foreground" />
          </View>
          <Text className="font-semibold">No trips yet</Text>
          <Text className="text-center text-xs text-muted-foreground">
            Parties you create or join will show up here.
          </Text>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(250)} className="overflow-hidden rounded-3xl border border-border bg-card">
          {list.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(40 * i)} layout={LinearTransition}>
              <PartyRow party={p} divider={i > 0} />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function PartyRow({ party, divider }: { party: PartySummary; divider: boolean }) {
  const live = !party.endedAt && !party.leftAt;
  const crew = party.members.filter((m) => !m.leftAt);
  const status = party.endedAt ? 'Ended' : party.leftAt ? 'You left' : 'Live';

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/party/[id]', params: { id: party.id } })}
      scaleTo={0.98}
      className={cn('flex-row items-center gap-3 p-4', divider && 'border-t border-border')}>
      <View className="flex-row">
        {crew.slice(0, 3).map((m, i) => (
          <View key={m.userId} className="rounded-full border-2 border-card" style={{ marginLeft: i ? -12 : 0 }}>
            <AvatarView avatar={m.avatar} size={30} />
          </View>
        ))}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold" numberOfLines={1}>
          {party.name}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {crew.length} {crew.length === 1 ? 'person' : 'people'} · {shortDate(party.createdAt)}
        </Text>
      </View>
      <View className={cn('flex-row items-center gap-1.5 rounded-full px-2.5 py-1', live ? 'bg-sage/15' : 'bg-muted')}>
        {live ? <LiveDot size={6} /> : null}
        <Text className={cn('text-xs font-semibold', live ? 'text-sage' : 'text-muted-foreground')}>{status}</Text>
      </View>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </PressableScale>
  );
}
