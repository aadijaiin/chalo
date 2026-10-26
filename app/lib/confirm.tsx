import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: LucideIcon;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let show: ((p: Pending) => void) | null = null;

/** Asks a yes/no question in a bottom sheet. Resolves true only if the user confirms. */
export function confirm(options: ConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    if (!show) return resolve(false);
    haptics.tap();
    show({ ...options, resolve });
  });
}

/** Mount once near the root. */
export function ConfirmHost() {
  const insets = useSafeAreaInsets();
  const [pending, setPending] = React.useState<Pending | null>(null);

  React.useEffect(() => {
    show = setPending;
    return () => {
      show = null;
    };
  }, []);

  const close = React.useCallback(
    (ok: boolean) => {
      if (!pending) return;
      if (ok && pending.destructive) haptics.error();
      pending.resolve(ok);
      setPending(null);
    },
    [pending]
  );

  React.useEffect(() => {
    if (!pending) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close(false);
      return true;
    });
    return () => sub.remove();
  }, [pending, close]);

  if (!pending) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <Pressable className="flex-1 bg-black/40" onPress={() => close(false)} accessibilityLabel="Dismiss" />
      </Animated.View>
      <Animated.View
        entering={motion.sheetIn}
        exiting={motion.sheetOut}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 gap-5 rounded-t-[32px] bg-card px-6 pt-3">
        <View className="h-1.5 w-10 self-center rounded-full bg-muted" />
        <View className="gap-3">
          {pending.icon ? (
            <View
              className={cn(
                'h-12 w-12 items-center justify-center rounded-2xl',
                pending.destructive ? 'bg-destructive/10' : 'bg-primary/10'
              )}>
              <Icon as={pending.icon} size={22} className={pending.destructive ? 'text-destructive' : 'text-primary'} />
            </View>
          ) : null}
          <Text className="text-xl font-extrabold tracking-tight">{pending.title}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">{pending.message}</Text>
        </View>
        <View className="gap-3">
          <Button
            size="lg"
            variant={pending.destructive ? 'destructive' : 'default'}
            onPress={() => close(true)}>
            <Text>{pending.confirmLabel}</Text>
          </Button>
          <Button size="lg" variant="ghost" onPress={() => close(false)}>
            <Text>{pending.cancelLabel ?? 'Cancel'}</Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
