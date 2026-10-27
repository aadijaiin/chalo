import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { formatDuration, formatKm } from '@/lib/format';
import { motion } from '@/lib/motion';
import type { PartyMember } from '@/lib/parties';
import { usePartyLive } from '@/lib/party-live';
import { useRecap, type MemberRecap, type Recap } from '@/lib/recap';
import type { LngLat } from '@/lib/routing';
import { MAP_STYLE, memberColor, THEME } from '@/lib/theme';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { ChevronLeft, Gauge, MapPin, Route, Share2, Timer } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

/** After the party: everyone's route on one map, and how far, how long and how fast each of you went. */
export default function TripRecap() {
  const scheme = useColorScheme().colorScheme ?? 'light';
  const { profile } = useAuth();
  const { state } = usePartyLive();
  const partyId = state.status === 'ready' ? state.party.id : '';
  const recap = useRecap(partyId);
  const cameraRef = React.useRef<CameraRef>(null);
  const [styleLoaded, setStyleLoaded] = React.useState(false);

  const members = state.status === 'ready' ? state.members : [];
  // Same colours as the live map: you in the brand colour, everyone else in join order.
  const colorOf = React.useMemo(() => {
    const out: Record<string, string> = {};
    members.filter((m) => !m.leftAt).forEach((m, i) => (out[m.userId] = memberColor(i)));
    members.forEach((m, i) => (out[m.userId] ??= memberColor(i)));
    if (profile) out[profile.id] = THEME[scheme].primary;
    return out;
  }, [members, profile?.id, scheme]);

  const trails =
    recap.status === 'ready'
      ? Object.values(recap.recap.members).filter((m) => m.trail.length > 1)
      : [];

  React.useEffect(() => {
    if (!styleLoaded || trails.length === 0) return;
    const all = trails.flatMap((t) => t.trail);
    const lngs = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    cameraRef.current?.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        duration: 800,
      }
    );
  }, [styleLoaded, trails.length]);

  if (state.status !== 'ready') return null;
  const { party } = state;

  async function share(r: Recap) {
    const lines = members
      .filter((m) => r.members[m.userId])
      .map((m) => {
        const s = r.members[m.userId];
        return `${firstName(m)}: ${formatKm(s.distanceM)}${s.topSpeedKmh ? `, top ${s.topSpeedKmh} km/h` : ''}`;
      });
    const span =
      r.startedAt && r.endedAt ? ` in ${formatDuration((r.endedAt - r.startedAt) / 1000)}` : '';
    await Share.share({
      message: [
        `${party.name}${party.destination ? ` → ${party.destination.name}` : ''}`,
        `${formatKm(r.totalM)} together${span}`,
        ...lines,
        '',
        'Tracked with chalo',
      ].join('\n'),
    }).catch(() => {});
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Back"
          className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon as={ChevronLeft} size={20} />
        </PressableScale>
        <View className="flex-1">
          <Text className="text-lg font-bold" numberOfLines={1}>
            Trip recap
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {party.name}
            {party.destination ? ` → ${party.destination.name}` : ''}
          </Text>
        </View>
        {recap.status === 'ready' && trails.length > 0 ? (
          <PressableScale
            onPress={() => share(recap.recap)}
            accessibilityLabel="Share recap"
            className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Icon as={Share2} size={18} className="text-primary-foreground" />
          </PressableScale>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}>
        <View className="h-64 overflow-hidden rounded-3xl bg-muted">
          <Map
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE[scheme]}
            androidView="texture"
            logo={false}
            compass={false}
            onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
            <Camera ref={cameraRef} initialViewState={{ center: [78.9629, 22.5937], zoom: 3.5 }} />
            {trails.map((t) => (
              <GeoJSONSource
                key={t.userId}
                id={`trail-${t.userId}`}
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates: t.trail },
                }}>
                <Layer
                  type="line"
                  id={`trail-casing-${t.userId}`}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{ 'line-color': THEME[scheme].card, 'line-width': 7 }}
                />
                <Layer
                  type="line"
                  id={`trail-line-${t.userId}`}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{
                    'line-color': colorOf[t.userId] ?? THEME[scheme].primary,
                    'line-width': 4,
                  }}
                />
              </GeoJSONSource>
            ))}
          </Map>
          {recap.status === 'loading' ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : null}
        </View>

        {recap.status === 'error' ? (
          <Text className="text-center text-sm text-muted-foreground">
            Couldn't load the recap: {recap.message}
          </Text>
        ) : recap.status === 'ready' && trails.length === 0 ? (
          <Text className="text-center text-sm text-muted-foreground">
            No route was recorded for this party. Recaps cover trips taken since this feature
            arrived.
          </Text>
        ) : recap.status === 'ready' ? (
          <>
            <Animated.View entering={motion.rise(60)} className="flex-row gap-2">
              <Total icon={Route} label="Together" value={formatKm(recap.recap.totalM)} />
              <Total
                icon={Timer}
                label="Trip took"
                value={
                  recap.recap.startedAt && recap.recap.endedAt
                    ? formatDuration((recap.recap.endedAt - recap.recap.startedAt) / 1000)
                    : '–'
                }
              />
            </Animated.View>
            <View className="gap-3">
              {members
                .filter((m) => recap.recap.members[m.userId])
                .sort(
                  (a, b) =>
                    recap.recap.members[b.userId].distanceM -
                    recap.recap.members[a.userId].distanceM
                )
                .map((m, i) => (
                  <Animated.View key={m.userId} entering={motion.rise(120 + 60 * i)}>
                    <MemberCard
                      member={m}
                      isMe={m.userId === profile?.id}
                      color={colorOf[m.userId]}
                      stats={recap.recap.members[m.userId]}
                    />
                  </Animated.View>
                ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function firstName(m: PartyMember) {
  return m.fullName.split(' ')[0] || m.username;
}

function Total({ icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <View className="flex-1 gap-1 rounded-3xl bg-card p-4 shadow-sm shadow-black/5">
      <View className="flex-row items-center gap-1.5">
        <Icon as={icon} size={14} className="text-primary" />
        <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </Text>
      </View>
      <Text className="text-2xl font-extrabold">{value}</Text>
    </View>
  );
}

function MemberCard({
  member,
  isMe,
  color,
  stats,
}: {
  member: PartyMember;
  isMe: boolean;
  color: string;
  stats: MemberRecap;
}) {
  const avg = stats.movingS > 60 ? Math.round((stats.distanceM / stats.movingS) * 3.6) : null;
  return (
    <View className="gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
          <AvatarView avatar={member.avatar} size={38} />
        </View>
        <Text className="flex-1 font-bold" numberOfLines={1}>
          {member.fullName || member.username}
          {isMe ? <Text className="text-muted-foreground font-normal"> (you)</Text> : null}
        </Text>
        <Text className="text-lg font-extrabold">{formatKm(stats.distanceM)}</Text>
      </View>
      <View className="flex-row gap-2">
        <Stat
          icon={Timer}
          label="Moving"
          value={stats.movingS > 60 ? formatDuration(stats.movingS) : '–'}
        />
        <Stat
          icon={Gauge}
          label="Top"
          value={stats.topSpeedKmh ? `${stats.topSpeedKmh} km/h` : '–'}
        />
        <Stat icon={Gauge} label="Avg" value={avg ? `${avg} km/h` : '–'} />
        <Stat icon={MapPin} label="Stops" value={String(stats.stops)} />
      </View>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-muted/60 px-2.5 py-2">
      <View className="flex-row items-center gap-1">
        <Icon as={icon} size={11} className="text-muted-foreground" />
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-bold" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
