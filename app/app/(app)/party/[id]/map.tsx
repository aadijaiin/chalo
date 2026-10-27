import { AvatarView } from '@/components/avatar-view';
import { LiveDot } from '@/components/live-dot';
import { PeerMarker } from '@/components/map/peer-marker';
import { SmoothMarker } from '@/components/map/smooth-marker';
import { UserMarker } from '@/components/map/user-marker';
import { PressableScale } from '@/components/pressable-scale';
import { SplashLoader } from '@/components/splash-loader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { formatDistance, timeAgo, tripLabel } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { EASE_OUT, motion } from '@/lib/motion';
import { distanceM, useLocation } from '@/lib/location';
import { usePartyLive, type Peer } from '@/lib/party-live';
import { endedMessage, type PartyMember } from '@/lib/parties';
import { destinationKey } from '@/lib/routing';
import { useSharing } from '@/lib/sharing';
import { useMyTrip } from '@/lib/trip';
import { MAP_STYLE, memberColor, THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ChevronLeft, Flag, LocateFixed, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LngLat = [number, number];

const FOCUS_ZOOM = 16;
const ME = 'me';

export default function PartyMap() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const { profile } = useAuth();
  const { state, peers, connection } = usePartyLive();
  const sharing = useSharing();
  const { location } = useLocation();
  const cameraRef = React.useRef<CameraRef>(null);
  const [styleLoaded, setStyleLoaded] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const framed = React.useRef(false);
  const framedWithFriends = React.useRef(false);

  const coords = location.status === 'ready' ? location.coords : null;
  const me: LngLat | null = coords ? [coords.longitude, coords.latitude] : null;

  const dest = state.status === 'ready' ? state.party.destination : null;
  const myTrip = useMyTrip(dest ? destinationKey(dest) : null);

  const crew = state.status === 'ready' ? state.members.filter((m) => !m.leftAt) : [];
  const others = crew
    .map((m, i) => ({ member: m, color: memberColor(i), peer: peers[m.userId] }))
    .filter((o) => o.member.userId !== profile?.id)
    // Heading somewhere: whoever's closest to it comes first.
    .sort((a, b) => (dest ? (a.peer?.remainingM ?? Infinity) - (b.peer?.remainingM ?? Infinity) : 0));
  const onMap = others.filter((o): o is typeof o & { peer: Peer } => Boolean(o.peer));

  const points: LngLat[] = [...(me ? [me] : []), ...onMap.map((o) => [o.peer.lng, o.peer.lat] as LngLat)];

  const fitAll = React.useCallback(
    (duration = 900) => {
      if (points.length === 0) return;
      setSelected(null);
      if (points.length === 1) {
        cameraRef.current?.flyTo({ center: points[0], zoom: FOCUS_ZOOM, duration });
        return;
      }
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
        padding: { top: insets.top + 120, bottom: insets.bottom + 200, left: 60, right: 60 },
        duration,
      });
    },
    [JSON.stringify(points), insets.top, insets.bottom]
  );

  // Frame everyone once: as soon as we have ourselves, and again when the first friend shows up.
  React.useEffect(() => {
    if (!styleLoaded || points.length === 0) return;
    if (!framed.current || (!framedWithFriends.current && onMap.length > 0)) {
      framed.current = true;
      framedWithFriends.current = onMap.length > 0;
      fitAll(1200);
    }
  }, [styleLoaded, points.length]);

  function showTrip() {
    if (!dest) return;
    haptics.select();
    setSelected(null);
    const pts: LngLat[] = [[dest.lng, dest.lat], ...(me ? [me] : [])];
    if (pts.length === 1) return cameraRef.current?.flyTo({ center: pts[0], zoom: FOCUS_ZOOM, duration: 900 });
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
      padding: { top: insets.top + 140, bottom: insets.bottom + 200, left: 60, right: 60 },
      duration: 900,
    });
  }

  function focus(id: string, lngLat: LngLat) {
    haptics.select();
    setSelected(id);
    cameraRef.current?.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 900 });
  }

  if (state.status !== 'ready') return <SplashLoader />;
  const { party } = state;
  const sharingHere = sharing.target?.id === party.id;
  const liveCount = onMap.filter((o) => o.peer.online).length + (sharingHere && me ? 1 : 0);

  return (
    <View className="flex-1 bg-background">
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE[scheme]}
        androidView="texture"
        logo={false}
        compass={false}
        attributionPosition={{ bottom: insets.bottom + 190, left: 12 }}
        onPress={() => setSelected(null)}
        onDidFinishLoadingStyle={() => setStyleLoaded(true)}>
        <Camera
          ref={cameraRef}
          initialViewState={me ? { center: me, zoom: FOCUS_ZOOM } : { center: [78.9629, 22.5937], zoom: 3.5 }}
        />
        {myTrip?.ahead && myTrip.ahead.length > 1 ? (
          <GeoJSONSource
            id="my-route"
            data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: myTrip.ahead } }}>
            <Layer
              type="line"
              id="my-route-casing"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': THEME[scheme].card, 'line-width': 9, 'line-opacity': 0.9 }}
            />
            <Layer
              type="line"
              id="my-route-line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': THEME[scheme].primary, 'line-width': 5 }}
            />
          </GeoJSONSource>
        ) : null}
        {dest ? (
          <Marker id="destination" lngLat={[dest.lng, dest.lat]} anchor="bottom">
            <View className="items-center">
              <View className="rounded-full bg-primary p-2 shadow-lg shadow-black/30">
                <Icon as={Flag} size={16} className="text-primary-foreground" />
              </View>
              <View className="-mt-[5px] h-3 w-3 rotate-45 bg-primary" style={{ borderBottomRightRadius: 2 }} />
            </View>
          </Marker>
        ) : null}
        {onMap.map(({ member, color, peer }) => (
          <SmoothMarker
            key={member.userId}
            id={`peer-${member.userId}`}
            lngLat={[peer.lng, peer.lat]}
            anchor="bottom"
            onPress={() => focus(member.userId, [peer.lng, peer.lat])}>
            <PeerMarker
              avatar={member.avatar}
              name={firstName(member)}
              color={color}
              online={peer.online}
              size={selected === member.userId ? 48 : 40}
            />
          </SmoothMarker>
        ))}
        {me && profile ? (
          <SmoothMarker id="me" lngLat={me} anchor="center">
            <UserMarker avatar={profile.avatar} size={44} />
          </SmoothMarker>
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
        className="absolute left-4 right-4 gap-2">
        <View className="flex-row items-center gap-3">
          <PressableScale
            onPress={() => router.back()}
            accessibilityLabel="Back to lobby"
            className="h-11 w-11 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
            <Icon as={ChevronLeft} size={22} />
          </PressableScale>
          <View className="flex-1 flex-row items-center gap-2.5 rounded-full bg-card px-4 py-2.5 shadow-lg shadow-black/20">
            <LiveDot live={connection === 'live' && liveCount > 0} />
            <Text className="flex-1 text-sm font-bold" numberOfLines={1}>
              {party.name}
            </Text>
            <Animated.View key={`${connection}-${liveCount}`} entering={FadeIn.duration(250)}>
              <Text className="text-xs font-semibold text-muted-foreground">
                {connection === 'live' ? `${liveCount} live` : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
              </Text>
            </Animated.View>
          </View>
        </View>
        {connection === 'off' ? (
          <Animated.View
            entering={FadeInDown.duration(250)}
            exiting={FadeOut.duration(200)}
            className="self-center rounded-full bg-foreground/85 px-3.5 py-1.5">
            <Text className="text-xs font-semibold text-background">Connection lost · positions may be stale</Text>
          </Animated.View>
        ) : null}
        {dest ? (
          <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(200)} className="self-start">
            <PressableScale
              onPress={showTrip}
              accessibilityLabel="Show route to destination"
              className="max-w-full flex-row items-center gap-2 rounded-full bg-card py-2 pl-2 pr-4 shadow-lg shadow-black/20">
              <View className="rounded-full bg-primary p-1.5">
                <Icon as={Flag} size={12} className="text-primary-foreground" />
              </View>
              <Text className="shrink text-xs font-bold" numberOfLines={1}>
                {dest.name}
              </Text>
              {sharingHere && myTrip?.eta ? (
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  · {myTrip.eta.arrived ? "you're there" : tripLabel(myTrip.eta)}
                </Text>
              ) : null}
            </PressableScale>
          </Animated.View>
        ) : null}
      </Animated.View>


      <Animated.View
        entering={FadeIn.delay(300)}
        style={{ bottom: insets.bottom + 196 }}
        className="absolute right-4 gap-3">
        {onMap.length > 0 ? (
          <Animated.View entering={FadeIn}>
            <PressableScale
              onPress={() => {
                haptics.select();
                fitAll();
              }}
              accessibilityLabel="Show everyone"
              className="h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg shadow-black/20">
              <Icon as={Users} size={20} className="text-primary" />
            </PressableScale>
          </Animated.View>
        ) : null}
        {me ? (
          <PressableScale
            onPress={() => focus(ME, me)}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4 pt-2">
          {profile ? (
            <CrewCard
              avatar={profile.avatar}
              name="You"
              color={THEME.light.primary}
              live={sharingHere && Boolean(me)}
              detail={
                !sharingHere
                  ? 'Not sharing'
                  : !me
                    ? 'Waiting for GPS'
                    : dest
                      ? (myTrip?.eta ? tripLabel(myTrip.eta)! : 'Finding your route…')
                      : sharing.background
                        ? 'Sharing · locked too'
                        : 'Sharing live'
              }
              selected={selected === ME}
              onPress={me ? () => focus(ME, me) : undefined}
            />
          ) : null}
          {others.map(({ member, color, peer }, i) => (
            <Animated.View key={member.userId} entering={FadeInUp.delay(80 * (i + 1))}>
              <CrewCard
                avatar={member.avatar}
                name={firstName(member)}
                color={color}
                live={Boolean(peer?.online)}
                detail={peerDetail(peer, coords, Boolean(dest))}
                selected={selected === member.userId}
                onPress={peer ? () => focus(member.userId, [peer.lng, peer.lat]) : undefined}
              />
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
      {party.endedAt ? (
        <Animated.View
          entering={motion.fade()}
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-background/70 px-8">
          <Animated.View entering={motion.settle(80)} className="w-full items-center gap-3 rounded-3xl bg-card p-6 shadow-xl shadow-black/10">
            <Text className="text-lg font-bold">This party has ended</Text>
            <Text className="text-center text-sm text-muted-foreground">
              {endedMessage(party.endedReason)} Location sharing stopped for everyone {timeAgo(party.endedAt)}.
            </Text>
            <Button className="mt-2 self-stretch" size="lg" variant="secondary" onPress={() => router.replace('/home')}>
              <Text>Back home</Text>
            </Button>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function firstName(m: PartyMember) {
  return m.fullName.split(' ')[0] || m.username;
}

function peerDetail(peer: Peer | undefined, me: { latitude: number; longitude: number } | null, hasDestination: boolean) {
  if (!peer) return 'Not sharing yet';
  const trip = hasDestination ? tripLabel(peer) : null;
  if (!peer.online) return trip ? `${trip} · ${timeAgo(peer.updatedAt)}` : `Seen ${timeAgo(peer.updatedAt)}`;
  if (trip) return trip;
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
  selected,
  onPress,
}: {
  avatar: PartyMember['avatar'];
  name: string;
  color: string;
  live: boolean;
  detail: string;
  selected: boolean;
  onPress?: () => void;
}) {
  const scheme = useColorScheme().colorScheme ?? 'light';
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(selected ? -4 : 0, { duration: 220, easing: EASE_OUT }) }],
  }));

  return (
    <Animated.View style={lift}>
      <PressableScale
        onPress={onPress}
        disabled={!onPress}
        className="w-40 overflow-hidden rounded-3xl shadow-xl shadow-black/10">
        <BlurView intensity={60} tint={scheme} style={StyleSheet.absoluteFill} />
        <View className="absolute inset-0 bg-card/85" />
        <View
          className={cn('absolute inset-0 rounded-3xl border-2', selected ? '' : 'border-border/60')}
          style={selected ? { borderColor: color } : undefined}
        />
        <View className="gap-3 p-3.5">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
              <AvatarView avatar={avatar} size={38} />
            </View>
            <LiveDot live={live} size={9} />
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
    </Animated.View>
  );
}
