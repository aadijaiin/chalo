import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatKm } from '@/lib/format';
import { motion } from '@/lib/motion';
import { parties, type Party, type PartyLocation } from '@/lib/parties';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Eye, Hourglass } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

type Watched = Party & { approved: boolean; lead: Lead | null };
type Lead = { name: string; remainingM: number; etaS: number | null; arrived: number };

const REFRESH_MS = 30_000;

/**
 * Who's closest to the destination, and how many have made it. Lookouts only receive positions
 * of people who don't hide from them, so this never reveals anyone hidden.
 */
function leadOf(locations: PartyLocation[], names: Record<string, string>): Lead | null {
  const withEta = locations.filter((l) => l.remainingM != null);
  if (withEta.length === 0) return null;
  const lead = withEta.reduce((a, b) => (a.remainingM! <= b.remainingM! ? a : b));
  return {
    name: names[lead.userId] ?? 'Someone',
    remainingM: lead.remainingM!,
    etaS: lead.etaS,
    arrived: withEta.filter((l) => l.remainingM === 0).length,
  };
}

async function load(userId: string): Promise<Watched[]> {
  const list = await parties.watching(userId);
  return Promise.all(
    list.map(async (party) => {
      if (!party.approved || !party.destination) return { ...party, lead: null };
      const [locations, members] = await Promise.all([
        parties.locations(party.id),
        parties.members(party.id),
      ]);
      const names = Object.fromEntries(
        members.map((m) => [m.userId, m.fullName.split(' ')[0] || m.username])
      );
      return { ...party, lead: leadOf(locations, names) };
    })
  );
}

function clock(etaS: number) {
  return new Date(Date.now() + etaS * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function detail(party: Watched) {
  if (!party.approved) return 'Waiting for the host to let you in';
  const lead = party.lead;
  if (!party.destination) return "Following the crew · you're not sharing";
  if (!lead) return `Headed to ${party.destination.name}`;
  if (lead.remainingM === 0) {
    return lead.arrived > 1
      ? `${lead.arrived} have reached ${party.destination.name}`
      : `${lead.name} reached ${party.destination.name}`;
  }
  return `${lead.name} · ${formatKm(lead.remainingM)} to go${lead.etaS ? ` · by ${clock(lead.etaS)}` : ''}`;
}

/** Live parties you follow as a lookout, one tap from home, with how close the crew is. */
export function WatchingCards({ userId }: { userId: string }) {
  const [list, setList] = React.useState<Watched[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const refresh = () =>
        load(userId)
          .then(setList)
          .catch(() => {});
      refresh();
      const id = setInterval(refresh, REFRESH_MS);
      return () => clearInterval(id);
    }, [userId])
  );

  if (list.length === 0) return null;
  return (
    <View className="gap-3">
      {list.map((party) => (
        <Animated.View
          key={party.id}
          entering={motion.rise()}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}>
          <PressableScale
            onPress={() => router.push({ pathname: '/party/[id]', params: { id: party.id } })}
            scaleTo={0.98}
            className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Icon as={party.approved ? Eye : Hourglass} size={18} className="text-primary" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
                {party.approved ? "You're a lookout" : 'Request sent'}
              </Text>
              <Text className="text-base font-bold" numberOfLines={1}>
                {party.name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {detail(party)}
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </PressableScale>
        </Animated.View>
      ))}
    </View>
  );
}
