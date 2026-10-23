import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View, type TextInputInstance, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type FormFieldProps = TextInputProps & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  secure?: boolean;
};

export const FormField = React.forwardRef<TextInputInstance, FormFieldProps>(function FormField(
  { label, icon, error, secure, onFocus, onBlur, ...props },
  ref
) {
  const { colorScheme } = useColorScheme();
  const t = THEME[colorScheme ?? 'light'];
  const [hidden, setHidden] = React.useState(true);
  const focus = useSharedValue(0);

  // The border eases toward the brand color on focus, or red when invalid.
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? t.destructive
      : interpolateColor(focus.value, [0, 1], [t.input, t.ring]),
  }));

  return (
    <View className="gap-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <Animated.View
        style={ringStyle}
        className="h-14 flex-row items-center rounded-2xl border bg-card px-4">
        {icon ? <Icon as={icon} size={18} className="mr-3 text-muted-foreground" /> : null}
        <Input
          ref={ref}
          className="h-full flex-1 border-0 bg-transparent px-0 shadow-none dark:bg-transparent"
          placeholderTextColor={t.mutedForeground}
          secureTextEntry={secure && hidden}
          onFocus={(e) => {
            focus.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
          {...props}
        />
        {secure ? (
          <Pressable
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Icon as={hidden ? Eye : EyeOff} size={18} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)}>
          <Text className={cn('text-xs font-medium text-destructive')}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
});
