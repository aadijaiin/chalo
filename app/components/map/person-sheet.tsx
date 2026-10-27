import { AvatarView } from '@/components/avatar-view';
import { LiveDot } from '@/components/live-dot';
import { PingBadge } from '@/components/map/ping-status';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { RouteTo } from '@/hooks/use-route-to';
import { formatDuration, formatKm, timeAgo, tripLabel } from '@/lib/format';
import { distanceM } from '@/lib/location';
import { motion } from '@/lib/motion';
import type { PartyMember } from '@/lib/parties';
import type { Peer } from '@/lib/party-live';
import { pingLabel, type Ping } from '@/lib/pings';
import {
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Crown,
  Handshake,
  LocateFixed,
  Navigation,
  SignalZero,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/** Someone in the party up close: how they're doing, where, and a live route to go meet them. */
export function PersonSheet({
  member,
  color,
  peer,
  isHost,
  ping,
  me,
  hasDestination,
  route,
  onToggleRoute,
  onCenter,
  onMeetHalfway,
  onClose,
}: {
  member: PartyMember;
  color: string;
  peer: Peer | undefined;
  isHost: boolean;
  ping: Ping | undefined;
  me: { latitude: number; longitude: number } | null;
  hasDestination: boolean;
  route: RouteTo;
  onToggleRoute: () => void;
  onCenter: () => void;
  /** Drops a meetup pin halfway along the route; only offered once there is one. */
  onMeetHalfway?: () => void;
  onClose: () => void;
}) {
  const name = member.fullName || member.username;
  const first = member.fullName.split(' ')[0] || member.username;
  const away = me && peer ? distanceM(me, { latitude: peer.lat, longitude: peer.lng }) : null;
  const kmh = peer?.speed != null ? Math.round(peer.speed * 3.6) : null;
  const trip = hasDestination && peer ? tripLabel(peer) : null;
  const routing = route.status !== 'off';
  const lowBattery = peer?.battery != null && peer.battery < 0.15 && !peer.charging;
  // Silence while driving is usually a dead zone, not someone ignoring the group.
  const noSignal = Boolean(peer && !peer.online && (peer.speed ?? 0) > 3);

  return (
    <Animated.View
      entering={motion.sheetIn}
      exiting={motion.sheetOut}
      className="mx-3 gap-4 rounded-3xl bg-card p-4 shadow-xl shadow-black/15">
      <View className="flex-row items-center gap-3">
        <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
          <AvatarView avatar={member.avatar} size={52} />
        </View>
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="shrink text-lg font-bold" numberOfLines={1}>
              {name}
            </Text>
            {isHost ? (
              <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                <Icon as={Crown} size={11} className="text-primary" />
                <Text className="text-[11px] text-primary font-semibold">Host</Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center gap-1.5">
            <LiveDot live={Boolean(peer?.online)} size={8} />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              @{member.username} ·{' '}
              {!peer
                ? 'not sharing yet'
                : peer.online
                  ? `live, updated ${timeAgo(peer.updatedAt)}`
                  : `last seen ${timeAgo(peer.updatedAt)}`}
            </Text>
            {peer?.battery != null ? (
              <View className="flex-row items-center gap-0.5">
                <Icon
                  as={batteryIcon(peer.battery, peer.charging)}
                  size={13}
                  className={lowBattery ? 'text-destructive' : 'text-muted-foreground'}
                />
                <Text
                  className={
                    lowBattery
                      ? 'text-xs text-destructive font-semibold'
                      : 'text-xs text-muted-foreground'
                  }>
                  {Math.round(peer.battery * 100)}%
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <PressableScale
          onPress={onClose}
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon as={X} size={18} />
        </PressableScale>
      </View>

      {lowBattery || noSignal ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl bg-destructive/10 px-3 py-2.5">
          <Icon as={lowBattery ? BatteryLow : SignalZero} size={16} className="text-destructive" />
          <Text className="flex-1 text-sm" numberOfLines={2}>
            {lowBattery
              ? `${first}'s phone is at ${Math.round(peer!.battery! * 100)}%. It may die soon.`
              : `${first} was moving when they went quiet, so they're probably out of signal.`}
          </Text>
        </View>
      ) : null}

      {ping ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl bg-primary/5 px-3 py-2.5">
          <PingBadge
            kind={ping.kind}
            size={14}
            className={ping.kind === 'sos' ? '' : 'bg-primary/10'}
          />
          <Text className="flex-1 text-sm font-semibold" numberOfLines={2}>
            {ping.kind === 'sos' ? `${first} sent an SOS` : pingLabel(ping)}
          </Text>
          <Text className="text-xs text-muted-foreground">{timeAgo(ping.at)}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Stat label="From you" value={away != null ? formatKm(away) : '–'} />
        <Stat label="Speed" value={kmh == null ? '–' : kmh < 3 ? 'Parked' : `${kmh} km/h`} />
        {hasDestination ? <Stat label="To destination" value={trip ?? '–'} /> : null}
      </View>

      {routing ? (
        <Animated.View
          entering={FadeIn}
          className="flex-row items-center gap-3 rounded-2xl border border-border px-3 py-2.5">
          <View className="rounded-xl p-2" style={{ backgroundColor: color }}>
            <Icon as={Navigation} size={16} className="text-white" />
          </View>
          <View className="flex-1">
            {route.status === 'ready' ? (
              <>
                <Text className="font-bold">
                  {formatKm(route.remainingM)} · {formatDuration(route.remainingS)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  to reach {first}, updating as you both move
                </Text>
              </>
            ) : route.status === 'together' ? (
              <>
                <Text className="font-bold">You're together</Text>
                <Text className="text-xs text-muted-foreground">
                  You and {first} are at the same spot.
                </Text>
              </>
            ) : route.status === 'error' ? (
              <Text className="text-sm text-muted-foreground">{route.message}</Text>
            ) : (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-muted-foreground">Finding a route to {first}…</Text>
              </View>
            )}
          </View>
        </Animated.View>
      ) : null}

      {onMeetHalfway ? (
        <Button variant="outline" onPress={onMeetHalfway}>
          <Icon as={Handshake} size={16} className="text-primary" />
          <Text>Meet halfway</Text>
        </Button>
      ) : null}

      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          disabled={!peer || !me}
          onPress={onToggleRoute}
          variant={routing ? 'secondary' : 'default'}>
          <Icon
            as={Navigation}
            size={16}
            className={routing ? 'text-foreground' : 'text-primary-foreground'}
          />
          <Text>{routing ? 'Stop route' : `Route to ${first}`}</Text>
        </Button>
        <Button
          variant="outline"
          disabled={!peer}
          onPress={onCenter}
          accessibilityLabel={`Show ${first} on the map`}>
          <Icon as={LocateFixed} size={16} className="text-primary" />
        </Button>
      </View>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-muted/60 px-3 py-2.5">
      <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </Text>
      <Text className="font-bold" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function batteryIcon(level: number, charging: boolean | null) {
  if (charging) return BatteryCharging;
  if (level < 0.15) return BatteryLow;
  if (level < 0.6) return BatteryMedium;
  return BatteryFull;
}
