import { haptics } from '@/lib/haptics';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: 'style' });

type PressableScaleProps = PressableProps & {
  className?: string;
  /** How far the element shrinks while pressed. */
  scaleTo?: number;
  haptic?: boolean;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

/** A Pressable that springs down on touch and gives a light haptic tick. */
export function PressableScale({
  scaleTo = 0.96,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withSpring(scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) haptics.tap();
        onPress?.(e);
      }}
      style={[style as object, animatedStyle]}
    />
  );
}
