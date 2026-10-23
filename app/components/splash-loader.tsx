import { LogoMark } from '@/components/logo';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Full-screen brand loader: the logo bobs while a ripple spreads under it. */
export function SplashLoader() {
  const bob = useSharedValue(0);
  const ripple = useSharedValue(0);

  React.useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
      ),
      -1
    );
    ripple.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.value),
    transform: [{ scaleX: 0.4 + ripple.value }, { scaleY: 0.2 + ripple.value * 0.3 }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Animated.View style={logoStyle}>
        <LogoMark size={64} />
      </Animated.View>
      <Animated.View style={rippleStyle} className="mt-1 h-6 w-16 rounded-full bg-primary/40" />
    </View>
  );
}
