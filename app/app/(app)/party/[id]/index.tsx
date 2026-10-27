import { AvatarView } from '@/components/avatar-view';
import { LiveDot } from '@/components/live-dot';
import { OfflineMapCard } from '@/components/party/offline-map-card';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { usePartyActions } from '@/hooks/use-party-actions';
import { useAuth } from '@/lib/auth';
import { formatDistance, timeAgo, tripLabel } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { distanceM, useLocation } from '@/lib/location';
import { motion } from '@/lib/motion';
import { inviteMessage, type Party, type PartyMember } from '@/lib/parties';
import { usePartyLive, type Peer } from '@/lib/party-live';
import { destinationKey } from '@/lib/routing';
import { useSharing } from '@/lib/sharing';
import { useMyTrip, type TripEta } from '@/lib/trip';
import { memberColor, THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Flag,
  LogOut,
  Map as MapIcon,
  MapPinned,
  Route,
  Share2,
  ShieldAlert,
  UserPlus,
} from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const enter = (i: number) => motion.rise(60 * i);

function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/home');
}

export default function PartyLobby() {
  const { profile } = useAuth();
  const { state, peers } = usePartyLive();
  const sharing = useSharing();
  const { location } = useLocation();
  const me = location.status === 'ready' ? location.coords : null;
  const dest = state.status === 'ready' ? state.party.destination : null;
  const myTrip = useMyTrip(dest ? destinationKey(dest) : null);

  if (state.status === 'loading') return <LobbySkeleton />;

  if (state.status !== 'ready') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-xl font-bold">Party not found</Text>
        <Text className="text-center text-sm text-muted-foreground">
          {state.status === 'error'
            ? state.message
            : "It may have been removed, or you're not in it."}
        </Text>
        <Button variant="secondary" onPress={goHome}>
          <Text>Back home</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const { party, members } = state;
  const active = members.filter((m) => !m.leftAt);
  const isHost = party.hostId === profile?.id;
  const ended = Boolean(party.endedAt);
  const iAmIn = active.some((m) => m.userId === profile?.id);
  const sharingHere = sharing.target?.id === party.id;
  const liveCount = Object.values(peers).filter((p) => p.online).length + (sharingHere ? 1 : 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : goHome())}
          accessibilityLabel="Back"
          className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon as={ChevronLeft} size={20} />
        </PressableScale>
        <Text className="flex-1 text-lg font-bold" numberOfLines={1}>
          {party.name}
        </Text>
        <PressableScale
          onPress={() => router.push({ pathname: '/party/[id]/recap', params: { id: party.id } })}
          accessibilityLabel={ended ? 'Trip recap' : 'Trip so far'}
          className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon as={Route} size={18} className="text-primary" />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <CodeCard party={party} ended={ended} />
        </Animated.View>

        {!ended ? (
          <Animated.View entering={enter(1)} layout={LinearTransition}>
            <SharingStatus party={party} iAmIn={iAmIn} />
          </Animated.View>
        ) : null}

        {!ended && (party.destination || isHost) ? (
          <Animated.View entering={enter(1.5)} layout={LinearTransition}>
            <DestinationCard
              party={party}
              isHost={isHost}
              mine={sharingHere ? (myTrip?.eta ?? null) : null}
            />
          </Animated.View>
        ) : null}

        {!ended && party.destination && sharingHere ? (
          <Animated.View entering={enter(1.75)} layout={LinearTransition}>
            <OfflineMapCard partyId={party.id} route={myTrip?.ahead ?? null} />
          </Animated.View>
        ) : null}

        <Animated.View entering={enter(2)} className="gap-3" layout={LinearTransition}>
          <View className="flex-row items-baseline justify-between">
            <Text className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Crew · {active.length}
            </Text>
            {!ended ? (
              <Animated.View key={liveCount} entering={FadeIn}>
                <Text className="text-xs text-muted-foreground">{liveCount} sharing location</Text>
              </Animated.View>
            ) : null}
          </View>
          <View className="overflow-hidden rounded-3xl border border-border bg-card">
            {active.map((m, i) => {
              const isMe = m.userId === profile?.id;
              return (
                <MemberRow
                  key={m.userId}
                  member={m}
                  isHost={m.userId === party.hostId}
                  isMe={isMe}
                  color={isMe ? THEME.light.primary : memberColor(i)}
                  status={memberStatus(
                    isMe,
                    peers[m.userId],
                    me,
                    sharingHere,
                    sharing.background,
                    ended,
                    party.destination ? (myTrip?.eta ?? null) : undefined
                  )}
                  divider={i > 0}
                />
              );
            })}
          </View>
          {active.length === 1 && !ended ? (
            <Animated.View
              entering={FadeInDown.delay(400)}
              exiting={FadeOut}
              className="flex-row items-center gap-3 rounded-3xl border border-dashed border-border p-4">
              <View className="rounded-2xl bg-primary/10 p-2.5">
                <Icon as={UserPlus} size={18} className="text-primary" />
              </View>
              <Text className="flex-1 text-xs text-muted-foreground">
                Waiting for your crew. Share the code and they'll pop in here as they join.
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View className="gap-3 px-5 pb-2">
        {ended || !iAmIn ? (
          <>
            {ended ? (
              <Button
                size="lg"
                onPress={() =>
                  router.push({ pathname: '/party/[id]/recap', params: { id: party.id } })
                }>
                <Icon as={Route} size={18} className="text-primary-foreground" />
                <Text>See trip recap</Text>
              </Button>
            ) : null}
            <Button size="lg" variant="secondary" onPress={goHome}>
              <Text>Back home</Text>
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              onPress={() =>
                router.push({ pathname: '/party/[id]/map', params: { id: party.id } })
              }>
              <Icon as={MapIcon} size={18} className="text-primary-foreground" />
              <Text>Open live map</Text>
            </Button>
            <ExitButton party={party} isHost={isHost} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function LobbySkeleton() {
  return (
    <SafeAreaView className="flex-1 gap-6 bg-background px-5 pt-2" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </View>
      <Skeleton className="h-60 rounded-3xl" />
      <Skeleton className="h-16 rounded-3xl" />
      <View className="gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-40 rounded-3xl" />
      </View>
    </SafeAreaView>
  );
}

function CodeCard({ party, ended }: { party: Party; ended: boolean }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    await Clipboard.setStringAsync(party.code);
    haptics.success();
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    try {
      await Share.share({ message: inviteMessage(party) });
    } catch {}
  }

  return (
    <View className="overflow-hidden rounded-3xl">
      <LinearGradient
        colors={
          ended ? ['hsl(25 6% 46%)', 'hsl(25 6% 36%)'] : [THEME.light.primary, 'hsl(18 78% 58%)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[18px] border-white/10" />

      <View className="gap-5 p-5">
        <View className="flex-row items-center gap-2">
          <LiveDot live={!ended} className="bg-white" />
          <Text className="text-xs uppercase tracking-widest text-white/90 font-semibold">
            {ended
              ? `Ended ${timeAgo(party.endedAt!)}`
              : `Live · started ${timeAgo(party.createdAt)}`}
          </Text>
        </View>

        <PressableScale
          onPress={ended ? undefined : copy}
          disabled={ended}
          scaleTo={0.98}
          className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/85">Party code</Text>
            {!ended ? (
              copied ? (
                <Animated.View
                  key="copied"
                  entering={motion.settle()}
                  exiting={FadeOut.duration(150)}
                  className="flex-row items-center gap-1 rounded-full bg-white px-2.5 py-1">
                  <Icon as={Check} size={12} className="text-primary" />
                  <Text className="text-xs text-primary font-bold">Copied</Text>
                </Animated.View>
              ) : (
                <Animated.View key="hint" entering={FadeIn} className="flex-row items-center gap-1">
                  <Icon as={Copy} size={12} className="text-white/70" />
                  <Text className="text-xs text-white/70">Tap to copy</Text>
                </Animated.View>
              )
            ) : null}
          </View>
          <View className="flex-row justify-between">
            {party.code.split('').map((c, i) => (
              <Animated.View
                key={i}
                entering={motion.settle(150 + i * 35)}
                className={cn(
                  'h-14 w-[14.5%] items-center justify-center rounded-2xl',
                  copied ? 'bg-white/35' : 'bg-white/20'
                )}>
                <Text className="text-2xl text-white font-extrabold">{c}</Text>
              </Animated.View>
            ))}
          </View>
        </PressableScale>

        {!ended ? (
          <PressableScale
            onPress={share}
            className="flex-row items-center gap-2 self-start rounded-full bg-white px-4 py-2.5">
            <Icon as={Share2} size={16} className="text-primary" />
            <Text className="text-sm text-primary font-bold">Share invite</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

/** Tells you whether your position is reaching the party, and fixes it in one tap when it isn't. */
function SharingStatus({ party, iAmIn }: { party: Party; iAmIn: boolean }) {
  const sharing = useSharing();
  const actions = usePartyActions();
  const [busy, setBusy] = React.useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  if (!iAmIn) {
    return (
      <StatusCard
        tone="muted"
        icon={LogOut}
        title="You left this party"
        body="Rejoin to see everyone and share your location again."
        action="Rejoin"
        busy={busy}
        onAction={() => run(() => actions.join(party.code))}
      />
    );
  }

  if (sharing.target?.id !== party.id) {
    return (
      <StatusCard
        tone="warn"
        icon={MapPinned}
        title="You're not sharing yet"
        body="Your crew can't see you on the map."
        action="Share"
        busy={busy}
        onAction={() => run(() => sharing.start(party))}
      />
    );
  }

  if (!sharing.background) {
    return (
      <StatusCard
        tone="warn"
        icon={ShieldAlert}
        title="Only while chalo is open"
        body={
          sharing.backgroundAccess === 'denied'
            ? 'Set location to “Allow all the time” so your crew still sees you when your phone is locked.'
            : 'Allow location all the time so your crew still sees you when your phone is locked.'
        }
        action={sharing.backgroundAccess === 'denied' ? 'Settings' : 'Allow'}
        busy={busy}
        onAction={() => run(sharing.requestBackground)}
      />
    );
  }

  return (
    <Animated.View
      entering={FadeIn}
      className="flex-row items-center gap-3 rounded-3xl border border-sage/30 bg-sage/10 px-4 py-3.5">
      <LiveDot />
      <Text className="flex-1 text-xs text-foreground font-medium">
        Sharing live, even with your phone locked. Leave the party to stop.
      </Text>
    </Animated.View>
  );
}

/** Where the party is headed and your ETA; the host taps it to pick or change the spot. */
function DestinationCard({
  party,
  isHost,
  mine,
}: {
  party: Party;
  isHost: boolean;
  mine: TripEta | null;
}) {
  const open = () => router.push({ pathname: '/party/[id]/destination', params: { id: party.id } });
  const dest = party.destination;

  if (!dest) {
    return (
      <PressableScale
        onPress={open}
        scaleTo={0.98}
        className="flex-row items-center gap-3 rounded-3xl border border-dashed border-primary/40 p-4">
        <View className="rounded-2xl bg-primary/10 p-2.5">
          <Icon as={Flag} size={18} className="text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold">Where to?</Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            Set a destination and everyone sees their route and ETA.
          </Text>
        </View>
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      </PressableScale>
    );
  }

  const eta = mine ? tripLabel(mine) : null;
  return (
    <PressableScale
      onPress={isHost ? open : undefined}
      disabled={!isHost}
      scaleTo={0.98}
      className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="rounded-2xl bg-primary p-2.5">
        <Icon as={Flag} size={18} className="text-primary-foreground" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Headed to
        </Text>
        <Text className="font-bold" numberOfLines={1}>
          {dest.name}
        </Text>
        {eta ? (
          <Animated.View key={eta} entering={FadeIn}>
            <Text className="text-xs text-muted-foreground">
              {mine?.arrived
                ? "You're there"
                : `You · ${eta}${mine?.etaS ? ` · by ${arrivalClock(mine.etaS)}` : ''}`}
            </Text>
            {mine?.next ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                Next stop: {mine.next.name} · {tripLabel(mine.next)}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      {isHost ? <Text className="text-xs text-primary font-semibold">Change</Text> : null}
    </PressableScale>
  );
}

function arrivalClock(etaS: number) {
  return new Date(Date.now() + etaS * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusCard({
  tone,
  icon,
  title,
  body,
  action,
  busy,
  onAction,
}: {
  tone: 'warn' | 'muted';
  icon: typeof MapPinned;
  title: string;
  body: string;
  action: string;
  busy: boolean;
  onAction: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
      className={cn(
        'flex-row items-center gap-3 rounded-3xl border p-4',
        tone === 'warn' ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}>
      <View className={cn('rounded-2xl p-2.5', tone === 'warn' ? 'bg-primary/10' : 'bg-muted')}>
        <Icon
          as={icon}
          size={18}
          className={tone === 'warn' ? 'text-primary' : 'text-muted-foreground'}
        />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-bold">{title}</Text>
        <Text className="text-xs leading-4 text-muted-foreground">{body}</Text>
      </View>
      <Button size="sm" loading={busy} onPress={onAction} className="rounded-full px-4">
        <Text>{action}</Text>
      </Button>
    </Animated.View>
  );
}

type MemberStatus = { live: boolean; label: string };

function memberStatus(
  isMe: boolean,
  peer: Peer | undefined,
  me: { latitude: number; longitude: number } | null,
  sharingHere: boolean,
  background: boolean,
  ended: boolean,
  /** Your own trip when the party has a destination; undefined when it doesn't. */
  myTrip?: TripEta | null
): MemberStatus {
  if (ended) return { live: false, label: 'Party ended' };
  if (isMe) {
    if (!sharingHere) return { live: false, label: 'Not sharing' };
    if (!me) return { live: false, label: 'Waiting for GPS' };
    const trip = myTrip !== undefined ? (myTrip ? tripLabel(myTrip) : 'Finding your route…') : null;
    return {
      live: true,
      label: trip ?? (background ? 'Sharing · works when locked' : 'Sharing while app is open'),
    };
  }
  if (!peer) return { live: false, label: 'Not sharing yet' };
  const trip = myTrip !== undefined ? tripLabel(peer) : null;
  if (!peer.online)
    return {
      live: false,
      label: trip
        ? `${trip} · ${timeAgo(peer.updatedAt)}`
        : `Last update ${timeAgo(peer.updatedAt)}`,
    };
  if (trip) return { live: true, label: trip };
  return {
    live: true,
    label: me
      ? formatDistance(distanceM(me, { latitude: peer.lat, longitude: peer.lng }))
      : 'On the map',
  };
}

function MemberRow({
  member,
  isHost,
  isMe,
  color,
  status,
  divider,
}: {
  member: PartyMember;
  isHost: boolean;
  isMe: boolean;
  color: string;
  status: MemberStatus;
  divider: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition}
      className={cn('flex-row items-center gap-3 p-4', divider && 'border-t border-border')}>
      <View>
        <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
          <AvatarView avatar={member.avatar} size={42} />
        </View>
        <View className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-card">
          <LiveDot live={status.live} size={9} />
        </View>
      </View>
      <View className="flex-1">
        <Text className="font-semibold" numberOfLines={1}>
          {member.fullName || member.username}
          {isMe ? <Text className="text-muted-foreground font-normal"> (you)</Text> : null}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          @{member.username} · {status.label}
        </Text>
      </View>
      {isHost ? (
        <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
          <Icon as={Crown} size={12} className="text-primary" />
          <Text className="text-xs text-primary font-semibold">Host</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

function ExitButton({ party, isHost }: { party: Party; isHost: boolean }) {
  const actions = usePartyActions();
  const [busy, setBusy] = React.useState(false);

  async function exit() {
    setBusy(true);
    const done = await actions.exit(party, isHost);
    if (done) goHome();
    else setBusy(false);
  }

  return (
    <Button size="lg" variant="outline" loading={busy} onPress={exit}>
      <Icon as={LogOut} size={18} className="text-destructive" />
      <Text className="text-destructive">{isHost ? 'End party' : 'Leave party'}</Text>
    </Button>
  );
}
