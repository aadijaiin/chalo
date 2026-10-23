import { AvatarView } from '@/components/avatar-view';
import { Icon } from '@/components/ui/icon';
import type { AvatarConfig } from '@/lib/avatar';
import { THEME } from '@/lib/theme';
import { Flag, Lock, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

const CREW: AvatarConfig[] = [
  { style: 'adventurer', seed: 'aanya' },
  { style: 'adventurer', seed: 'kabir' },
  { style: 'adventurer', seed: 'meera' },
  { style: 'adventurer', seed: 'rohan' },
];

export const ILLUSTRATION_SIZE = 300;

function useBob(delay: number, distance = 6) {
  const y = useSharedValue(0);
  React.useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

function FloatingAvatar({
  avatar,
  x,
  y,
  size = 52,
  delay = 0,
}: {
  avatar: AvatarConfig;
  x: number;
  y: number;
  size?: number;
  delay?: number;
}) {
  const style = useBob(delay);
  return (
    <Animated.View style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2 }, style]}>
      <View className="rounded-full bg-card p-1 shadow-lg shadow-black/20">
        <AvatarView avatar={avatar} size={size} />
      </View>
    </Animated.View>
  );
}

/** Slide 1: a stylised map with the whole crew scattered across it. */
export function CrewMapIllustration() {
  const { colorScheme } = useColorScheme();
  const t = THEME[colorScheme ?? 'light'];
  const S = ILLUSTRATION_SIZE;
  return (
    <View style={{ width: S, height: S }}>
      <Svg width={S} height={S} viewBox="0 0 300 300">
        <Rect x="10" y="10" width="280" height="280" rx="36" fill={t.card} />
        <Path d="M10 120 C 90 100, 160 160, 290 130" stroke={t.muted} strokeWidth="18" fill="none" />
        <Path d="M120 10 C 110 120, 190 180, 170 290" stroke={t.muted} strokeWidth="14" fill="none" />
        <Path d="M10 230 L 290 210" stroke={t.muted} strokeWidth="10" fill="none" />
        <Rect x="200" y="30" width="70" height="60" rx="14" fill={t.sage} opacity={0.25} />
        <Rect x="30" y="160" width="60" height="44" rx="12" fill={t.sage} opacity={0.2} />
      </Svg>
      <FloatingAvatar avatar={CREW[0]} x={80} y={80} delay={0} />
      <FloatingAvatar avatar={CREW[1]} x={225} y={150} delay={350} />
      <FloatingAvatar avatar={CREW[2]} x={120} y={225} delay={700} />
      <FloatingAvatar avatar={CREW[3]} x={235} y={250} size={40} delay={1050} />
    </View>
  );
}

/** Slide 2: a winding route with riders strung along it, lead to sweep. */
export function RouteIllustration() {
  const { colorScheme } = useColorScheme();
  const t = THEME[colorScheme ?? 'light'];
  const S = ILLUSTRATION_SIZE;
  return (
    <View style={{ width: S, height: S }}>
      <Svg width={S} height={S} viewBox="0 0 300 300">
        <Rect x="10" y="10" width="280" height="280" rx="36" fill={t.card} />
        <Path
          d="M40 260 C 40 180, 150 220, 150 150 S 260 120, 260 40"
          stroke={t.primary}
          strokeOpacity={0.25}
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M40 260 C 40 180, 150 220, 150 150 S 260 120, 260 40"
          stroke={t.primary}
          strokeWidth="4"
          strokeDasharray="2 12"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View className="absolute rounded-full bg-primary p-2" style={{ left: 244, top: 18 }}>
        <Icon as={Flag} size={16} className="text-white" />
      </View>
      <FloatingAvatar avatar={CREW[1]} x={232} y={88} size={44} delay={0} />
      <FloatingAvatar avatar={CREW[0]} x={150} y={160} size={48} delay={300} />
      <FloatingAvatar avatar={CREW[2]} x={62} y={222} size={44} delay={600} />
    </View>
  );
}

/** Slide 3: a shield with a slow pulse, for the privacy promise. */
export function PrivacyIllustration() {
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1);
  }, []);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 0.7 + pulse.value * 0.6 }],
  }));
  const bob = useBob(0, 8);
  const S = ILLUSTRATION_SIZE;

  return (
    <View style={{ width: S, height: S }} className="items-center justify-center">
      <Animated.View style={ring} className="absolute h-64 w-64 rounded-full bg-sage" />
      <View className="absolute h-52 w-52 rounded-full bg-sage/15" />
      <Animated.View style={bob} className="items-center justify-center rounded-[40px] bg-card p-8 shadow-xl shadow-black/15">
        <Icon as={ShieldCheck} size={84} strokeWidth={1.5} className="text-sage" />
        <View className="absolute bottom-5 right-5 rounded-full bg-primary p-2">
          <Icon as={Lock} size={14} className="text-white" />
        </View>
      </Animated.View>
    </View>
  );
}
