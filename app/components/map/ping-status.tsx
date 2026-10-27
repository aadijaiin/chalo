import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { confirm } from '@/lib/confirm';
import { timeAgo } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { notify } from '@/lib/notify';
import { PING_META, pings, type Ping, type PingKind } from '@/lib/pings';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

/** A ping's icon in a round chip; SOS is red so it reads at a glance. */
export function PingBadge({ kind, size = 14, className }: { kind: PingKind; size?: number; className?: string }) {
  const sos = kind === 'sos';
  return (
    <View
      className={cn('items-center justify-center rounded-full', sos ? 'bg-destructive' : 'bg-white', className)}
      style={{ padding: size * 0.4 }}>
      <Icon as={PING_META[kind].icon} size={size} className={sos ? 'text-white' : 'text-primary'} />
    </View>
  );
}

/** Ends a status. Cancelling an SOS asks first, since it tells everyone you're OK. */
export async function endStatus(ping: Ping, mine: boolean, who: string) {
  if (ping.kind === 'sos') {
    const ok = await confirm({
      title: mine ? 'Cancel your SOS?' : `Clear ${who}'s SOS?`,
      message: mine
        ? "Everyone in the party will be told you're OK."
        : `Only do this if you know ${who} is OK. Everyone will be told the SOS was cleared.`,
      confirmLabel: mine ? "I'm OK, cancel it" : 'Clear SOS',
      cancelLabel: 'Keep it on',
      icon: ShieldCheck,
    });
    if (!ok) return false;
  }
  try {
    await pings.clear(ping.id);
    haptics.success();
    return true;
  } catch (e) {
    notify.error("Couldn't update that", (e as Error).message);
    return false;
  }
}

/** Your active status, just above the crew cards, with a button to end it. */
export function MyStatusBar({ ping }: { ping: Ping }) {
  const [busy, setBusy] = React.useState(false);
  const meta = PING_META[ping.kind];
  const sos = ping.kind === 'sos';

  async function end() {
    setBusy(true);
    if (!(await endStatus(ping, true, 'You'))) setBusy(false);
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOut.duration(200)}
      className={cn(
        'mx-4 flex-row items-center gap-3 rounded-full py-2 pl-2 pr-2 shadow-lg shadow-black/15',
        sos ? 'bg-destructive' : 'bg-card'
      )}>
      <PingBadge kind={ping.kind} size={16} className={sos ? 'bg-white/20' : 'bg-primary/10'} />
      <View className="flex-1">
        <Text className={cn('text-sm font-bold', sos && 'text-white')} numberOfLines={1}>
          {sos ? 'Your SOS is on' : meta.label}
        </Text>
        <Text className={cn('text-xs', sos ? 'text-white/80' : 'text-muted-foreground')} numberOfLines={1}>
          {sos ? 'Everyone was alerted' : 'Your crew sees this'} · {timeAgo(ping.at)}
        </Text>
      </View>
      <Button
        size="sm"
        variant={sos ? 'secondary' : 'default'}
        loading={busy}
        onPress={end}
        className="rounded-full px-4">
        <Text>{meta.done}</Text>
      </Button>
    </Animated.View>
  );
}

/** Someone else's SOS stays pinned under the header until it's cleared. */
export function SosBanner({
  ping,
  who,
  canClear,
  onShow,
}: {
  ping: Ping;
  who: string;
  canClear: boolean;
  onShow: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOut.duration(200)}
      className="flex-row items-center gap-3 rounded-3xl bg-destructive p-3 shadow-lg shadow-black/20">
      <PingBadge kind="sos" size={16} className="bg-white/20" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-white" numberOfLines={1}>
          {who} needs help
        </Text>
        <Text className="text-xs text-white/80" numberOfLines={1}>
          SOS sent {timeAgo(ping.at)}
        </Text>
      </View>
      <PressableScale onPress={onShow} className="rounded-full bg-white px-3.5 py-2">
        <Text className="text-xs font-bold text-destructive">Show</Text>
      </PressableScale>
      {canClear ? (
        <PressableScale onPress={() => endStatus(ping, false, who)} className="rounded-full bg-white/20 px-3.5 py-2">
          <Text className="text-xs font-bold text-white">Clear</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}
