import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { useThemePreference } from '@/lib/theme-preference';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/** Flips light/dark; the icon spins through the swap. */
export function ThemeToggle({ className }: { className?: string }) {
  const { colorScheme } = useColorScheme();
  const { setPreference } = useThemePreference();
  const isDark = colorScheme === 'dark';
  const spin = useSharedValue(isDark ? 1 : 0);

  React.useEffect(() => {
    spin.value = withSpring(isDark ? 1 : 0, { damping: 14, stiffness: 140 });
  }, [isDark]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 180}deg` }, { scale: 1 - Math.sin(spin.value * Math.PI) * 0.25 }],
  }));

  return (
    <PressableScale
      haptic={false}
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onPress={() => setPreference(isDark ? 'light' : 'dark')}
      className={cn('h-11 w-11 items-center justify-center rounded-full bg-muted', className)}>
      <Animated.View style={iconStyle}>
        <Icon as={isDark ? Sun : Moon} size={19} />
      </Animated.View>
    </PressableScale>
  );
}
