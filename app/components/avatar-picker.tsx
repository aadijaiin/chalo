import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AVATAR_STYLES, randomSeed, type AvatarConfig, type AvatarStyle } from '@/lib/avatar';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Shuffle } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type AvatarPickerProps = {
  value: AvatarConfig;
  onChange: (value: AvatarConfig) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const spin = useSharedValue(0);
  const pop = useSharedValue(1);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { rotate: `${spin.value}deg` }],
  }));

  function celebrate() {
    pop.value = withSequence(withTiming(0.85, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 260 }));
    spin.value = withSequence(withTiming(-8, { duration: 90 }), withSpring(0, { damping: 6 }));
  }

  function shuffle() {
    celebrate();
    onChange({ ...value, seed: randomSeed() });
  }

  function pickStyle(style: AvatarStyle) {
    if (style === value.style) return;
    haptics.select();
    celebrate();
    onChange({ ...value, style });
  }

  return (
    <View className="items-center gap-4">
      <View>
        <Animated.View style={avatarStyle} className="rounded-full border-4 border-primary/30 p-1">
          <AvatarView avatar={value} size={104} />
        </Animated.View>
        <PressableScale
          onPress={shuffle}
          accessibilityLabel="Shuffle avatar"
          className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary">
          <Icon as={Shuffle} size={16} className="text-white" />
        </PressableScale>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-1">
        {(Object.keys(AVATAR_STYLES) as AvatarStyle[]).map((style) => {
          const active = style === value.style;
          return (
            <PressableScale
              key={style}
              haptic={false}
              onPress={() => pickStyle(style)}
              className={cn(
                'flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-3',
                active ? 'border-primary bg-primary/10' : 'border-border bg-card'
              )}>
              <AvatarView avatar={{ style, seed: value.seed }} size={26} />
              <Text className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                {AVATAR_STYLES[style].label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}
