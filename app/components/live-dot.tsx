import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A status dot that breathes a soft ring while live and sits still otherwise. */
export function LiveDot({ live = true, size = 8, className }: { live?: boolean; size?: number; className?: string }) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = live ? withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1) : 0;
  }, [live]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 1.6 }],
  }));

  const color = live ? (className ?? 'bg-sage') : 'bg-muted-foreground/40';
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {live ? (
        <Animated.View
          style={[ring, { width: size, height: size, borderRadius: size / 2, position: 'absolute' }]}
          className={color}
        />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2 }} className={cn(color)} />
    </View>
  );
}
