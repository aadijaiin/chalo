import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { motion } from '@/lib/motion';
import { notify } from '@/lib/notify';
import { PING_META, pings, QUICK_PINGS, type PingKind } from '@/lib/pings';
import { Siren } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SOS_HOLD_MS = 1500;

/** One-tap pings for the whole party, plus an SOS you have to hold so it can't go off by accident. */
export function PingSheet({ partyId, onClose }: { partyId: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [sending, setSending] = React.useState<PingKind | null>(null);

  async function send(kind: PingKind) {
    if (sending) return;
    setSending(kind);
    try {
      await pings.send(partyId, kind);
      haptics.success();
      const meta = PING_META[kind];
      notify.success(
        kind === 'sos' ? 'SOS sent' : `${meta.label} sent`,
        kind === 'sos' ? 'Everyone in the party has been alerted. Cancel it from the map once you\'re OK.' : 'Tap Done on the map when it\'s over.'
      );
      onClose();
    } catch (e) {
      haptics.error();
      notify.error("Couldn't send that", (e as Error).message);
      setSending(null);
    }
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={motion.fade()} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable onPress={onClose} accessibilityLabel="Close" style={StyleSheet.absoluteFill} className="bg-black/30" />
      </Animated.View>
      <Animated.View
        entering={motion.sheetIn}
        exiting={motion.sheetOut}
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-3xl bg-card px-5 pt-3 shadow-xl shadow-black/20">
        <View className="h-1 w-10 self-center rounded-full bg-border" />
        <View className="gap-0.5">
          <Text className="text-lg font-bold">Ping the crew</Text>
          <Text className="text-xs text-muted-foreground">Everyone gets a notification, even with their phone locked.</Text>
        </View>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {QUICK_PINGS.map((kind) => {
            const meta = PING_META[kind];
            return (
              <PressableScale
                key={kind}
                onPress={() => send(kind)}
                disabled={sending !== null}
                className="w-[48.5%] flex-row items-center gap-3 rounded-2xl border border-border bg-background p-4"
                style={{ opacity: sending && sending !== kind ? 0.5 : 1 }}>
                <View className="rounded-xl bg-primary/10 p-2">
                  <Icon as={meta.icon} size={18} className="text-primary" />
                </View>
                <Text className="font-semibold">{sending === kind ? 'Sending…' : meta.label}</Text>
              </PressableScale>
            );
          })}
        </View>
        <SosButton disabled={sending !== null} onTrigger={() => send('sos')} />
      </Animated.View>
    </View>
  );
}

function SosButton({ disabled, onTrigger }: { disabled: boolean; onTrigger: () => void }) {
  const progress = useSharedValue(0);
  const [holding, setHolding] = React.useState(false);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  function start() {
    if (disabled) return;
    haptics.tap();
    setHolding(true);
    progress.value = withTiming(1, { duration: SOS_HOLD_MS, easing: Easing.linear });
  }

  function cancel() {
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 180 });
  }

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      onLongPress={() => {
        cancel();
        onTrigger();
      }}
      delayLongPress={SOS_HOLD_MS}
      disabled={disabled}
      accessibilityLabel="Send SOS, press and hold"
      className="h-14 overflow-hidden rounded-2xl border-2 border-destructive/60 bg-destructive/10">
      <Animated.View style={fill} className="absolute bottom-0 left-0 top-0 bg-destructive/30" />
      <View className="flex-1 flex-row items-center justify-center gap-2">
        <Icon as={Siren} size={18} className="text-destructive" />
        <Text className="font-bold text-destructive">{holding ? 'Keep holding…' : 'Hold for SOS'}</Text>
      </View>
    </Pressable>
  );
}
