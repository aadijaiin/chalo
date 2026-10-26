import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { motion } from '@/lib/motion';
import { CODE_LENGTH as LENGTH, normalizeCode } from '@/lib/parties';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Six code boxes backed by one hidden input, so paste and backspace just work. */
type JoinResult = 'joined' | 'cancelled' | 'failed';

export function JoinCodeCard({ onJoin }: { onJoin: (code: string) => Promise<JoinResult> }) {
  const inputRef = React.useRef<TextInputInstance>(null);
  const [code, setCode] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [joining, setJoining] = React.useState(false);
  const [joined, setJoined] = React.useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  function reject() {
    setJoined(false);
    haptics.error();
    shake.value = withSequence(...[-8, 8, -6, 6, -3, 0].map((x) => withTiming(x, { duration: 45 })));
  }

  async function submit() {
    if (joining) return;
    if (code.length < LENGTH) {
      reject();
      inputRef.current?.focus();
      return;
    }
    inputRef.current?.blur();
    setJoining(true);
    const result = await onJoin(code);
    setJoining(false);
    if (result === 'failed') return reject();
    if (result === 'joined') {
      // Flash the boxes green, then reset quietly once the lobby has slid in.
      setJoined(true);
      setTimeout(() => {
        setJoined(false);
        setCode('');
      }, 700);
    }
  }

  return (
    <View className="gap-4 rounded-3xl border border-border bg-card p-5">
      <View className="gap-1">
        <Text className="text-lg font-bold">Have a party code?</Text>
        <Text className="text-sm text-muted-foreground">Ask the host for their 6-character code.</Text>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()}>
        <Animated.View style={shakeStyle} className="flex-row justify-between">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const char = code[i];
            const active = focused && i === Math.min(code.length, LENGTH - 1);
            return (
              <View
                key={i}
                className={cn(
                  'h-14 w-[14.5%] items-center justify-center rounded-2xl border bg-background',
                  joined ? 'border-sage bg-sage/10' : active ? 'border-primary' : char ? 'border-foreground/20' : 'border-input'
                )}>
                {char ? (
                  <Animated.View key={`${i}-${char}`} entering={motion.settle()}>
                    <Text className={cn('text-xl font-bold', joined && 'text-sage')}>{char}</Text>
                  </Animated.View>
                ) : active ? (
                  <Caret />
                ) : null}
              </View>
            );
          })}
        </Animated.View>
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => setCode(normalizeCode(t))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={submit}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={LENGTH}
        returnKeyType="go"
        className="absolute h-0 w-0 opacity-0"
      />

      <Button variant="secondary" size="lg" loading={joining} onPress={submit}>
        <Text>Join party</Text>
      </Button>
    </View>
  );
}

/** A blinking caret in the box you're about to type into. */
function Caret() {
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="h-6 w-0.5 rounded-full bg-primary" />;
}
