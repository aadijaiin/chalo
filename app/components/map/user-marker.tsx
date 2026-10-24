import { AvatarView } from '@/components/avatar-view';
import type { AvatarConfig } from '@/lib/avatar';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function Pulse({ delay, halo }: { delay: number; halo: number }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - t.value),
    transform: [{ scale: 0.35 + t.value * 0.65 }],
  }));
  return (
    <Animated.View
      style={[style, { width: halo, height: halo, borderRadius: halo / 2, position: 'absolute' }]}
      className="bg-primary"
    />
  );
}

/** The signed-in user's pin: avatar in a ring, a pointer, and radiating pulses. */
export function UserMarker({ avatar, size = 52 }: { avatar: AvatarConfig; size?: number }) {
  const halo = Math.round(size * 2.3);
  return (
    <View style={{ width: halo, height: halo }} className="items-center justify-center">
      <Pulse delay={0} halo={halo} />
      <Pulse delay={1200} halo={halo} />
      <View className="items-center">
        <View className="rounded-full bg-primary p-[3px] shadow-lg shadow-black/30">
          <View className="rounded-full bg-white p-[2px]">
            <AvatarView avatar={avatar} size={size} />
          </View>
        </View>
        <View
          className="-mt-[5px] h-3 w-3 rotate-45 bg-primary"
          style={{ borderBottomRightRadius: 2 }}
        />
      </View>
    </View>
  );
}
