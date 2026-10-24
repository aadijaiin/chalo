import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ThemePreference } from '@/lib/preferences';
import { useThemePreference } from '@/lib/theme-preference';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const PAD = 4;

/**
 * System / Light / Dark picker with a pill that slides to the selection.
 * Only the pill animates, and its classes never change: NativeWind can't add
 * styles to an animated component after mount (that crashed the old version).
 */
export function ThemeSegmented() {
  const { preference, setPreference } = useThemePreference();
  const index = OPTIONS.findIndex((o) => o.value === preference);
  const [segment, setSegment] = React.useState(0);
  const x = useSharedValue(0);

  React.useEffect(() => {
    x.value = withSpring(index * segment, { damping: 20, stiffness: 220 });
  }, [index, segment]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      className="flex-row rounded-2xl bg-muted"
      style={{ padding: PAD }}
      onLayout={(e) => setSegment((e.nativeEvent.layout.width - PAD * 2) / OPTIONS.length)}>
      {segment ? (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-xl bg-card shadow-sm shadow-black/10"
          style={[{ top: PAD, bottom: PAD, left: PAD, width: segment }, pillStyle]}
        />
      ) : null}
      {OPTIONS.map((option) => {
        const active = option.value === preference;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPreference(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="flex-1 flex-row items-center justify-center gap-2 py-3">
            <Icon as={option.icon} size={16} className={active ? 'text-primary' : 'text-muted-foreground'} />
            <Text className={active ? 'text-sm font-semibold' : 'text-sm font-semibold text-muted-foreground'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
