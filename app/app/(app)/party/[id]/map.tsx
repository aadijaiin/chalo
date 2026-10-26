import { AvatarView } from '@/components/avatar-view';
import { PeerMarker } from '@/components/map/peer-marker';
import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { SplashLoader } from '@/components/splash-loader';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { formatDistance, timeAgo } from '@/lib/format';
import { distanceM, useLocation } from '@/lib/location';
import { usePartyLive, type Peer } from '@/lib/party-live';
import type { PartyMember } from '@/lib/parties';
import { MAP_STYLE, memberColor, THEME } from '@/lib/theme';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ChevronLeft, LocateFixed, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LngLat = [number, number];

const FOCUS_ZOOM = 16;

export default function PartyMap() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const { profile } = useAuth();
  const { state, peers, connection } = usePartyLive();
  const { location } = useLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const [styleLoaded, setStyleLoaded] = React.useState(false);
  const framed = React.useRef(false);

  const coords = location.status === 'ready' ? location.coords : null;
  const me: LngLat | null = coords ? [coords.longitude, coords.latitude] : null;

  const crew = state.status === 'ready' ? state.members.filter((m) => !m.leftAt) : [];
  const others = crew
    .map((m, i) => ({ member: m, color: memberColor(i), peer: peers[m.userId] }))
    .filter((o) => o.member.userId !== profile?.id);
  const onMap = others.filter((o): o is typeof o & { peer: Peer } => Boolean(o.peer));

  const points: LngLat[] = [...(me ? [me] : []), ...onMap.map((o) => [o.peer.lng, o.peer.lat] as LngLat)];

  const padding = { top: insets.top + 120, bottom: insets.bottom + 200, left: 60, right: 60 };

  const fitAll = React.useCallback(
    (duration = 900) => {
      if (points.length === 0) return;
      if (points.length === 1) {
        cameraRef.current?.flyTo({ center: points[0], zoom: FOCUS_ZOOM, duration });
        return;
      }
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
        padding,
        duration,
      });
    },
    [JSON.stringify(points), insets.top, insets.bottom]
  );

  // Frame everyone once: as soon as we have ourselves, and again when the first friend shows up.
  const framedWithFriends = React.useRef(false);
  React.useEffect(() => {
    if (!styleLoaded || points.length === 0) return;
    if (!framed.current || (!framedWithFriends.current && onMap.length > 0)) {
      framed.current = true;
      framedWithFriends.current = onMap.length > 0;
      fitAll(1200);
    }
  }, [styleLoaded, points.length]);

  function focus(lngLat: LngLat) {
    cameraRef.current?.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 900 });
  }

  if (state.status !== 'ready') return <SplashLoader />;
  const { party } = state;
  const liveCount = onMap.filter((o) => o.peer.online).length + (me && connection === 'live' ? 1 : 0);

  return (
    <View className="flex-1 bg-background">
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        androidView="texture"
        logo={false}
        compass={false}
        attributionPosition={{ bottom: insets.bottom + 190, left: 12 }}
        onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
        <Camera
          ref={cameraRef}
          initialViewState={me ? { center: me, zoom: FOCUS_ZOOM } : { center: [78.9629, 22.5937], zoom: 3.5 }}
        />
        {onMap.map(({ member, color, peer }) => (
          <Marker key={member.userId} id={`peer-${member.userId}`} lngLat={[peer.lng, peer.lat]} anchor="bottom">
            <PeerMarker
              avatar={member.avatar}
              name={firstName(member)}
              color={color}
              online={peer.online}
            />
          </Marker>
        ))}
        {me && profile ? (
          <Marker id="me" lngLat={me} anchor="center">
            <UserMarker avatar={profile.avatar} size={44} />
          </Marker>
        ) : null}
      </Map>

      {!styleLoaded ? (
        <Animated.View exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFill} className="bg-background">
          <Skeleton className="flex-1 rounded-none opacity-60" />
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 right-4 flex-row items-center gap-3">
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Back to lobby"
          className="h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
          <Icon as={ChevronLeft} size={22} />
        </PressableScale>
        <View className="flex-1 flex-row items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-lg shadow-black/20">
          <View className={connection === 'live' ? 'h-2 w-2 rounded-full bg-sage' : 'h-2 w-2 rounded-full bg-muted-foreground/50'} />
          <Text className="flex-1 text-sm font-bold" numberOfLines={1}>
            {party.name}
          </Text>
          <Text className="text-xs font-semibold text-muted-foreground">
            {connection === 'live' ? `${liveCount} live` : connection === 'connecting' ? 'Connecting…' : 'Offline'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(300)}
        style={{ bottom: insets.bottom + 196 }}
        className="absolute right-4 gap-3">
        {onMap.length > 0 ? (
          <PressableScale
            onPress={() => fitAll()}
            accessibilityLabel="Show everyone"
            className="h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={Users} size={20} className="text-primary" />
          </PressableScale>
        ) : null}
        {me ? (
          <PressableScale
            onPress={() => focus(me)}
            accessibilityLabel="Center on me"
            className="h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={LocateFixed} size={20} className="text-primary" />
          </PressableScale>
        ) : null}
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(450).delay(100)}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-4">
          {profile ? (
            <CrewCard
              avatar={profile.avatar}
              name="You"
              color={THEME.light.primary}
              live={Boolean(me)}
              detail={me ? 'Sharing live' : 'Waiting for GPS'}
              onPress={me ? () => focus(me) : undefined}
            />
          ) : null}
          {others.map(({ member, color, peer }) => (
            <CrewCard
              key={member.userId}
              avatar={member.avatar}
              name={firstName(member)}
              color={color}
              live={Boolean(peer?.online)}
              detail={peerDetail(peer, coords)}
              onPress={peer ? () => focus([peer.lng, peer.lat]) : undefined}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function firstName(m: PartyMember) {
  return m.fullName.split(' ')[0] || m.username;
}

function peerDetail(peer: Peer | undefined, me: { latitude: number; longitude: number } | null) {
  if (!peer) return 'Not sharing yet';
  if (!peer.online) return `Seen ${timeAgo(peer.at)}`;
  const away = me ? formatDistance(distanceM(me, { latitude: peer.lat, longitude: peer.lng })) : 'Live';
  const speed = peer.speed && peer.speed > 1 ? ` · ${Math.round(peer.speed * 3.6)} km/h` : '';
  return away + speed;
}

function CrewCard({
  avatar,
  name,
  color,
  live,
  detail,
  onPress,
}: {
  avatar: PartyMember['avatar'];
  name: string;
  color: string;
  live: boolean;
  detail: string;
  onPress?: () => void;
}) {
  const scheme = useColorScheme().colorScheme ?? 'light';
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      className="w-40 overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-black/10">
      <BlurView intensity={60} tint={scheme} style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-card/85" />
      <View className="gap-3 p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
            <AvatarView avatar={avatar} size={38} />
          </View>
          <View className={live ? 'h-2.5 w-2.5 rounded-full bg-sage' : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/40'} />
        </View>
        <View className="gap-0.5">
          <Text className="font-bold" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {detail}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
