import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { SplashLoader } from '@/components/splash-loader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { formatDistance, timeAgo } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { distanceM, useLocation } from '@/lib/location';
import { notify } from '@/lib/notify';
import { inviteMessage, parties, type Party, type PartyMember } from '@/lib/parties';
import { usePartyLive, type Connection, type Peer } from '@/lib/party-live';
import { memberColor, THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Crown, LogOut, Map as MapIcon, Share2, UserPlus } from 'lucide-react-native';
import * as React from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const enter = (i: number) => FadeInDown.duration(400).delay(70 * i);

function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/home');
}

export default function PartyLobby() {
  const { profile } = useAuth();
  const { state, peers, connection } = usePartyLive();
  const { location } = useLocation();
  const me = location.status === 'ready' ? location.coords : null;

  if (state.status === 'loading') return <SplashLoader />;

  if (state.status !== 'ready') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-xl font-bold">Party not found</Text>
        <Text className="text-center text-sm text-muted-foreground">
          {state.status === 'error' ? state.message : "It may have been removed, or you're not in it."}
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
      </View>

      <ScrollView contentContainerClassName="gap-6 px-5 pb-6 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <CodeCard party={party} ended={ended} />
        </Animated.View>

        <Animated.View entering={enter(1)} className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Crew · {active.length}
            </Text>
            {!ended ? (
              <Text className="text-xs text-muted-foreground">
                {Object.values(peers).filter((p) => p.online).length + (me && connection === 'live' ? 1 : 0)} sharing location
              </Text>
            ) : null}
          </View>
          <View className="overflow-hidden rounded-3xl border border-border bg-card">
            {active.map((m, i) => (
              <MemberRow
                key={m.userId}
                member={m}
                isHost={m.userId === party.hostId}
                isMe={m.userId === profile?.id}
                color={m.userId === profile?.id ? THEME.light.primary : memberColor(i)}
                status={memberStatus(m.userId === profile?.id, peers[m.userId], me, connection)}
                divider={i > 0}
              />
            ))}
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
        {ended ? (
          <Button size="lg" variant="secondary" onPress={goHome}>
            <Text>Back home</Text>
          </Button>
        ) : (
          <>
            <Button size="lg" onPress={() => router.push({ pathname: '/party/[id]/map', params: { id: party.id } })}>
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

function CodeCard({ party, ended }: { party: Party; ended: boolean }) {
  async function share() {
    try {
      await Share.share({ message: inviteMessage(party) });
    } catch {}
  }

  return (
    <View className="overflow-hidden rounded-3xl">
      <LinearGradient
        colors={ended ? ['hsl(25 6% 46%)', 'hsl(25 6% 36%)'] : [THEME.light.primary, 'hsl(18 78% 58%)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[18px] border-white/10" />

      <View className="gap-5 p-5">
        <View className="flex-row items-center gap-2">
          <View className={ended ? 'h-2 w-2 rounded-full bg-white/60' : 'h-2 w-2 rounded-full bg-white'} />
          <Text className="text-xs font-semibold uppercase tracking-widest text-white/90">
            {ended ? `Ended ${timeAgo(party.endedAt!)}` : `Live · started ${timeAgo(party.createdAt)}`}
          </Text>
        </View>

        <PressableScale onPress={ended ? undefined : share} disabled={ended} className="gap-2">
          <Text className="text-sm text-white/85">Party code</Text>
          <View className="flex-row justify-between">
            {party.code.split('').map((c, i) => (
              <View key={i} className="h-14 w-[14.5%] items-center justify-center rounded-2xl bg-white/20">
                <Text className="text-2xl font-extrabold text-white">{c}</Text>
              </View>
            ))}
          </View>
        </PressableScale>

        {!ended ? (
          <PressableScale
            onPress={share}
            className="flex-row items-center gap-2 self-start rounded-full bg-white px-4 py-2.5">
            <Icon as={Share2} size={16} className="text-primary" />
            <Text className="text-sm font-bold text-primary">Share invite</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

type MemberStatus = { live: boolean; label: string };

function memberStatus(
  isMe: boolean,
  peer: Peer | undefined,
  me: { latitude: number; longitude: number } | null,
  connection: Connection
): MemberStatus {
  if (isMe) {
    if (!me) return { live: false, label: 'Waiting for GPS' };
    if (connection === 'connecting') return { live: false, label: 'Connecting…' };
    if (connection === 'off') return { live: false, label: "Can't reach the party right now" };
    return { live: true, label: 'Sharing your location' };
  }
  if (!peer) return { live: false, label: 'Not sharing yet' };
  const away = me ? formatDistance(distanceM(me, { latitude: peer.lat, longitude: peer.lng })) : 'on the map';
  return peer.online ? { live: true, label: away } : { live: false, label: `Offline · seen ${timeAgo(peer.at)}` };
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
      className={divider ? 'flex-row items-center gap-3 border-t border-border p-4' : 'flex-row items-center gap-3 p-4'}>
      <View>
        <View className="rounded-full p-[2px]" style={{ backgroundColor: color }}>
          <AvatarView avatar={member.avatar} size={42} />
        </View>
        <View
          className={status.live ? 'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-sage' : 'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-muted-foreground/50'}
        />
      </View>
      <View className="flex-1">
        <Text className="font-semibold" numberOfLines={1}>
          {member.fullName || member.username}
          {isMe ? <Text className="font-normal text-muted-foreground"> (you)</Text> : null}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          @{member.username} · {status.label}
        </Text>
      </View>
      {isHost ? (
        <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
          <Icon as={Crown} size={12} className="text-primary" />
          <Text className="text-xs font-semibold text-primary">Host</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

function ExitButton({ party, isHost }: { party: Party; isHost: boolean }) {
  const [busy, setBusy] = React.useState(false);

  function confirm() {
    haptics.tap();
    Alert.alert(
      isHost ? 'End this party?' : 'Leave this party?',
      isHost
        ? 'Everyone stops sharing location and the code stops working.'
        : 'You can rejoin later with the same code while it’s live.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isHost ? 'End party' : 'Leave', style: 'destructive', onPress: run },
      ]
    );
  }

  async function run() {
    setBusy(true);
    try {
      if (isHost) await parties.end(party.id);
      else await parties.leave(party.id);
      notify.success(isHost ? 'Party ended' : 'You left the party');
      goHome();
    } catch (e) {
      setBusy(false);
      notify.error(isHost ? "Couldn't end the party" : "Couldn't leave", (e as Error).message);
    }
  }

  return (
    <Button size="lg" variant="outline" loading={busy} onPress={confirm}>
      <Icon as={LogOut} size={18} className="text-destructive" />
      <Text className="text-destructive">{isHost ? 'End party' : 'Leave party'}</Text>
    </Button>
  );
}
