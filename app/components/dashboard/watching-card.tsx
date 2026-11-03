import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { motion } from '@/lib/motion';
import { parties, type Party } from '@/lib/parties';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Eye } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

/** Live parties you follow as a lookout, one tap from home. */
export function WatchingCards({ userId }: { userId: string }) {
  const [list, setList] = React.useState<Party[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      parties
        .watching(userId)
        .then(setList)
        .catch(() => {});
    }, [userId])
  );

  if (list.length === 0) return null;
  return (
    <View className="gap-3">
      {list.map((party) => (
        <Animated.View key={party.id} entering={motion.rise()} exiting={FadeOut.duration(200)} layout={LinearTransition}>
          <PressableScale
            onPress={() => router.push({ pathname: '/party/[id]', params: { id: party.id } })}
            scaleTo={0.98}
            className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={Eye} size={18} className="text-primary" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-xs font-semibold uppercase tracking-widest text-primary">You're a lookout</Text>
              <Text className="text-base font-bold" numberOfLines={1}>
                {party.name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {party.destination ? `Headed to ${party.destination.name}` : 'Following the crew'} · you're not sharing
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </PressableScale>
        </Animated.View>
      ))}
    </View>
  );
}
