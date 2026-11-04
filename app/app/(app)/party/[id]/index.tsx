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
import { confirm } from '@/lib/confirm';
import { notify } from '@/lib/notify';
import {
  inviteMessage,
  lookoutMessage,
  parties,
  watchMessage,
  type Party,
  type PartyMember,
} from '@/lib/parties';
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
  Eye,
  EyeOff,
  Flag,
  Globe,
  Hourglass,
  Link2Off,
  LogOut,
  Map as MapIcon,
  MapPinned,
  Route,
  Share2,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated';
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
  const crew = active.filter((m) => m.role === 'crew');
  const lookouts = active.filter((m) => m.role === 'lookout');
  const isHost = party.hostId === profile?.id;
  const ended = Boolean(party.endedAt);
  const mine = members.find((m) => m.userId === profile?.id);
  const iAmIn = Boolean(mine && !mine.leftAt);
  const isLookout = mine?.role === 'lookout';
  // Asked to watch, and the host hasn't said yes yet.
  const pending = isLookout && iAmIn && !mine?.approved;
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
          {isLookout && iAmIn && !ended ? (
            <LookoutHero party={party} pending={pending} />
          ) : (
            <CodeCard party={party} ended={ended} />
          )}
        </Animated.View>

        {!ended && !(isLookout && iAmIn) ? (
          <Animated.View entering={enter(1)} layout={LinearTransition}>
            <SharingStatus
              party={party}
              iAmIn={iAmIn}
              wasLookout={isLookout}
              removed={Boolean(mine?.removed)}
            />
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
              Crew · {crew.length}
            </Text>
            {!ended ? (
              <Animated.View key={liveCount} entering={FadeIn}>
                <Text className="text-xs text-muted-foreground">{liveCount} sharing location</Text>
              </Animated.View>
            ) : null}
          </View>
          {/* Rows already here on first render skip their entering animation: nested inside the
              section's own, it could stall at opacity 0 for rows that mounted below the fold. */}
          <LayoutAnimationConfig skipEntering>
            <View className="overflow-hidden rounded-3xl border border-border bg-card">
              {crew.map((m, i) => {
                const isMe = m.userId === profile?.id;
                return (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    isHost={m.userId === party.hostId}
                    isMe={isMe}
                    color={isMe ? THEME.light.primary : memberColor(i)}
                    status={
                      pending && !ended
                        ? { live: false, label: 'Visible once the host lets you in' }
                        : isLookout && m.hiddenFromLookouts && !ended
                          ? { live: false, label: 'Hidden from lookouts' }
                          : !iAmIn && !ended && m.userId !== profile?.id
                            ? { live: false, label: 'Only visible to people in the party' }
                            : memberStatus(
                                isMe,
                                peers[m.userId],
                                me,
                                sharingHere,
                                sharing.background,
                                ended,
                                party.destination ? (myTrip?.eta ?? null) : undefined
                              )
                    }
                    divider={i > 0}
                  />
                );
              })}
            </View>
          </LayoutAnimationConfig>
          {crew.length === 1 && !isLookout && !ended ? (
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

        {lookouts.length > 0 || (!ended && iAmIn && !isLookout) ? (
          <Animated.View entering={enter(3)} className="gap-3" layout={LinearTransition}>
            <Text className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Lookouts · {lookouts.length}
            </Text>
            {lookouts.length > 0 ? (
              <LayoutAnimationConfig skipEntering>
                <View className="overflow-hidden rounded-3xl border border-border bg-card">
                  {lookouts.map((m, i) => (
                    <LookoutRow
                      key={m.userId}
                      party={party}
                      member={m}
                      isMe={m.userId === profile?.id}
                      canRemove={isHost && !ended}
                      divider={i > 0}
                    />
                  ))}
                </View>
              </LayoutAnimationConfig>
            ) : null}
            {!ended && iAmIn && !isLookout && mine ? (
              <>
                <AddLookout party={party} first={lookouts.length === 0} isHost={isHost} />
                <LookoutVisibility party={party} hidden={mine.hiddenFromLookouts} />
              </>
            ) : null}
          </Animated.View>
        ) : null}
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
            {pending ? null : (
              <Button
                size="lg"
                onPress={() =>
                  router.push({ pathname: '/party/[id]/map', params: { id: party.id } })
                }>
                <Icon as={MapIcon} size={18} className="text-primary-foreground" />
                <Text>Open live map</Text>
              </Button>
            )}
            {isLookout ? (
              <StopWatchingButton party={party} pending={pending} />
            ) : (
              <ExitButton party={party} isHost={isHost} />
            )}
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

/** Takes the place of the code card for lookouts: what they can see, and that nobody sees them. */
function LookoutHero({ party, pending }: { party: Party; pending: boolean }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card">
      <View className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[18px] border-primary/10" />
      <View className="gap-4 p-5">
        <View className="flex-row items-center gap-2">
          <LiveDot />
          <Text className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Live · started {timeAgo(party.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Icon as={pending ? Hourglass : Eye} size={22} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-extrabold">
              {pending ? 'Waiting for the host' : "You're a lookout"}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {pending ? `You asked to follow ${party.name}` : `Following ${party.name}`}
            </Text>
          </View>
        </View>
        <Text className="text-sm leading-5 text-muted-foreground">
          {pending
            ? "The host decides who can watch. Once they let you in you'll see the crew live on the map. Your own location isn't shared."
            : "You see the crew live on the map and hear about SOS, arrivals and anyone falling behind. Your own location isn't shared with them."}
        </Text>
      </View>
    </View>
  );
}

/** Lets family follow along: they see the crew, and the crew can see they're watching. */
function AddLookout({ party, first, isHost }: { party: Party; first: boolean; isHost: boolean }) {
  const [busy, setBusy] = React.useState<'web' | 'off' | null>(null);

  async function shareApp() {
    haptics.tap();
    try {
      await Share.share({ message: lookoutMessage(party) });
    } catch {}
  }

  async function shareWeb() {
    haptics.tap();
    setBusy('web');
    try {
      const token = await parties.createWatchLink(party.id);
      await Share.share({ message: watchMessage(party, token) });
    } catch (e) {
      notify.error("Couldn't make a watch link", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function turnOff() {
    const ok = await confirm({
      icon: Link2Off,
      title: 'Turn off the web link?',
      message:
        'Anyone following in a browser stops seeing the crew. You can make a new link later.',
      confirmLabel: 'Turn off',
      destructive: true,
    });
    if (!ok) return;
    setBusy('off');
    try {
      await parties.revokeWatchLink(party.id);
      notify.success('Web link turned off');
    } catch (e) {
      notify.error("Couldn't turn it off", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="gap-3 rounded-3xl border border-dashed border-border p-4">
      <View className="flex-row items-center gap-3">
        <View className="rounded-2xl bg-primary/10 p-2.5">
          <Icon as={Eye} size={18} className="text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-bold">
            {first ? 'Add a lookout' : 'Add another lookout'}
          </Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            Let family follow the trip from home. They see the crew; their location isn't shared.
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" onPress={shareApp} className="flex-1 rounded-full">
          <Icon as={Share2} size={14} />
          <Text>In the app</Text>
        </Button>
        {isHost ? (
          <Button
            size="sm"
            variant="secondary"
            loading={busy === 'web'}
            onPress={shareWeb}
            className="flex-1 rounded-full">
            <Icon as={Globe} size={14} />
            <Text>Web link</Text>
          </Button>
        ) : null}
      </View>
      {!isHost ? (
        <Text className="text-xs text-muted-foreground">
          The host lets each lookout in, and can make a web link for family without the app.
        </Text>
      ) : null}
      {party.watchToken ? (
        <View className="flex-row items-center gap-2">
          <LiveDot size={7} />
          <Text className="flex-1 text-xs text-muted-foreground">
            A web link is on: anyone with it can watch until the party ends.
          </Text>
          {isHost ? (
            <Button size="sm" variant="ghost" loading={busy === 'off'} onPress={turnOff}>
              <Text className="text-destructive">Turn off</Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Your own say in being watched: hide yourself from lookouts and they won't see you at all. */
function LookoutVisibility({ party, hidden }: { party: Party; hidden: boolean }) {
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    haptics.select();
    setBusy(true);
    try {
      await parties.setHiddenFromLookouts(party.id, !hidden);
    } catch (e) {
      notify.error("Couldn't change that", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="rounded-2xl bg-muted p-2.5">
        <Icon as={hidden ? EyeOff : Eye} size={18} className="text-muted-foreground" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-bold">
          {hidden ? "Lookouts can't see you" : 'Lookouts can see you'}
        </Text>
        <Text className="text-xs leading-4 text-muted-foreground">
          {hidden
            ? 'Your crew still can. Lookouts and web links don’t get your position or alerts.'
            : 'Hide yourself if you’d rather only the crew saw where you are.'}
        </Text>
      </View>
      <Button
        size="sm"
        variant="outline"
        loading={busy}
        onPress={toggle}
        className="rounded-full px-4">
        <Text>{hidden ? 'Show me' : 'Hide me'}</Text>
      </Button>
    </View>
  );
}

function LookoutRow({
  party,
  member,
  isMe,
  canRemove,
  divider,
}: {
  party: Party;
  member: PartyMember;
  isMe: boolean;
  canRemove: boolean;
  divider: boolean;
}) {
  const name = member.fullName || member.username;

  const pending = !member.approved;
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    const ok = await confirm({
      icon: EyeOff,
      title: pending ? `Decline ${name.split(' ')[0]}?` : `Remove ${name.split(' ')[0]}?`,
      message: pending
        ? 'They won’t see the crew, and they can’t ask again for this party.'
        : 'They stop seeing the crew right away, and can’t come back to this party.',
      confirmLabel: pending ? 'Decline' : 'Remove lookout',
      destructive: true,
    });
    if (!ok) return;
    try {
      await parties.removeLookout(party.id, member.userId);
      notify.success(pending ? 'Request declined' : 'Lookout removed', name);
    } catch (e) {
      notify.error("Couldn't do that", (e as Error).message);
    }
  }

  async function approve() {
    haptics.success();
    setBusy(true);
    try {
      await parties.approveLookout(party.id, member.userId);
    } catch (e) {
      notify.error("Couldn't let them in", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition}
      className={cn('flex-row items-center gap-3 p-4', divider && 'border-t border-border')}>
      <View>
        <View className="rounded-full border-2 border-dashed border-muted-foreground/40 p-[2px]">
          <AvatarView avatar={member.avatar} size={38} />
        </View>
        <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-muted p-1">
          <Icon as={Eye} size={10} className="text-muted-foreground" />
        </View>
      </View>
      <View className="flex-1">
        <Text className="font-semibold" numberOfLines={1}>
          {name}
          {isMe ? <Text className="text-muted-foreground font-normal"> (you)</Text> : null}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          @{member.username} · {pending ? 'wants to watch' : 'watching, not sharing'}
        </Text>
      </View>
      {canRemove && pending ? (
        <Button size="sm" loading={busy} onPress={approve} className="rounded-full px-4">
          <Text>Let in</Text>
        </Button>
      ) : null}
      {canRemove ? (
        <PressableScale
          onPress={remove}
          accessibilityLabel={pending ? `Decline ${name}` : `Remove ${name} as a lookout`}
          className="h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Icon as={X} size={14} className="text-muted-foreground" />
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

/** Tells you whether your position is reaching the party, and fixes it in one tap when it isn't. */
function SharingStatus({
  party,
  iAmIn,
  wasLookout,
  removed,
}: {
  party: Party;
  iAmIn: boolean;
  wasLookout: boolean;
  removed: boolean;
}) {
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

  if (!iAmIn && removed) {
    return (
      <StatusCard
        tone="muted"
        icon={EyeOff}
        title="The host removed you"
        body="You can't see this party any more."
      />
    );
  }

  if (!iAmIn && wasLookout) {
    return (
      <StatusCard
        tone="muted"
        icon={EyeOff}
        title="You're not watching any more"
        body="Follow the crew again while the party is live. Your location stays private."
        action="Watch"
        busy={busy}
        onAction={() => run(() => actions.join(party.code, { asLookout: true }))}
      />
    );
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
  action?: string;
  busy?: boolean;
  onAction?: () => void;
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
      {action ? (
        <Button size="sm" loading={busy} onPress={onAction} className="rounded-full px-4">
          <Text>{action}</Text>
        </Button>
      ) : null}
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

function StopWatchingButton({ party, pending }: { party: Party; pending: boolean }) {
  const actions = usePartyActions();
  const [busy, setBusy] = React.useState(false);

  async function stop() {
    setBusy(true);
    const done = await actions.stopWatching(party);
    if (done) goHome();
    else setBusy(false);
  }

  return (
    <Button size="lg" variant="outline" loading={busy} onPress={stop}>
      <Icon as={EyeOff} size={18} className="text-destructive" />
      <Text className="text-destructive">{pending ? 'Cancel request' : 'Stop watching'}</Text>
    </Button>
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
