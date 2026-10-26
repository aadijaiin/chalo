import { LiveDot } from '@/components/live-dot';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { motion } from '@/lib/motion';
import { useSharing } from '@/lib/sharing';
import { router } from 'expo-router';
import { ChevronRight, Lock } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

/** Shown on home while you're live in a party, so getting back to it is one tap. */
export function ActivePartyCard() {
  const { target, background } = useSharing();
  if (!target) return null;

  return (
    <Animated.View entering={motion.rise()} exiting={FadeOut.duration(200)} layout={LinearTransition}>
      <PressableScale
        onPress={() => router.push({ pathname: '/party/[id]', params: { id: target.id } })}
        scaleTo={0.98}
        className="flex-row items-center gap-3 rounded-3xl border border-sage/30 bg-sage/10 p-4">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-sage/15">
          <LiveDot size={10} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-sage">You're live</Text>
          <Text className="text-base font-bold" numberOfLines={1}>
            {target.name}
          </Text>
          <View className="flex-row items-center gap-1">
            {background ? <Icon as={Lock} size={11} className="text-muted-foreground" /> : null}
            <Text className="text-xs text-muted-foreground">
              {background ? 'Sharing even when your phone is locked' : 'Sharing while chalo is open'}
            </Text>
          </View>
        </View>
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      </PressableScale>
    </Animated.View>
  );
}
