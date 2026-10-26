import { AvatarView } from '@/components/avatar-view';
import { ActivePartyCard } from '@/components/dashboard/active-party-card';
import { JoinCodeCard } from '@/components/dashboard/join-code-card';
import { LiveLocationCard } from '@/components/dashboard/live-location-card';
import { RecentParties } from '@/components/dashboard/recent-parties';
import { StartPartyCard } from '@/components/dashboard/start-party-card';
import { KeyboardScrollView } from '@/components/keyboard-scroll-view';
import { PressableScale } from '@/components/pressable-scale';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { usePartyActions } from '@/hooks/use-party-actions';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const enter = (i: number) => FadeInDown.duration(450).delay(80 * i);

export default function Home() {
  const { profile } = useAuth();
  const firstName = profile?.fullName.split(' ')[0] || profile?.username || '';

  const actions = usePartyActions();

  async function join(code: string) {
    try {
      const party = await actions.join(code);
      if (!party) return 'cancelled';
      router.push({ pathname: '/party/[id]', params: { id: party.id } });
      return 'joined';
    } catch (e) {
      notify.error("Couldn't join", (e as Error).message);
      return 'failed';
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardScrollView
        bottomOffset={24}
        contentContainerClassName="gap-5 px-5 pb-10 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)} className="flex-row items-center gap-3">
          <PressableScale onPress={() => router.push('/profile')} accessibilityLabel="Open profile">
            {profile ? (
              <View className="rounded-full border-2 border-primary/30 p-0.5">
                <AvatarView avatar={profile.avatar} size={44} />
              </View>
            ) : (
              <Skeleton className="h-12 w-12 rounded-full" />
            )}
          </PressableScale>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">{greeting()}</Text>
            {firstName ? (
              <Text className="text-xl tracking-tight font-extrabold">{firstName}</Text>
            ) : (
              <Skeleton className="mt-1 h-5 w-24" />
            )}
          </View>
          <ThemeToggle />
        </Animated.View>

        <ActivePartyCard />

        <Animated.View entering={enter(1)} layout={LinearTransition}>
          <StartPartyCard onPress={() => router.push('/party/new')} />
        </Animated.View>

        <Animated.View entering={enter(2)} layout={LinearTransition}>
          {profile ? (
            <LiveLocationCard avatar={profile.avatar} onOpen={() => router.push('/map')} />
          ) : (
            <Skeleton className="h-64 rounded-3xl" />
          )}
        </Animated.View>

        <Animated.View entering={enter(3)} layout={LinearTransition}>
          <JoinCodeCard onJoin={join} />
        </Animated.View>

        <Animated.View entering={enter(4)} layout={LinearTransition}>
          {profile ? <RecentParties userId={profile.id} /> : null}
        </Animated.View>
      </KeyboardScrollView>
    </SafeAreaView>
  );
}
