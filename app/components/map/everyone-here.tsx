import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { usePartyActions } from '@/hooks/use-party-actions';
import type { Party } from '@/lib/parties';
import { router } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

/** Shown once the whole crew has reached the destination; the host can wrap the party up here. */
export function EveryoneHere({ party, isHost }: { party: Party; isHost: boolean }) {
  const actions = usePartyActions();
  const [busy, setBusy] = React.useState(false);

  async function end() {
    setBusy(true);
    // Asks first, then ends sharing for everyone.
    if (await actions.exit(party, true)) router.replace({ pathname: '/party/[id]', params: { id: party.id } });
    else setBusy(false);
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
      className="mx-4 flex-row items-center gap-3 rounded-3xl bg-sage p-3 shadow-lg shadow-black/15">
      <View className="rounded-2xl bg-white/20 p-2.5">
        <Icon as={PartyPopper} size={18} className="text-white" />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-white" numberOfLines={1}>
          Everyone's here
        </Text>
        <Text className="text-xs text-white/85" numberOfLines={1}>
          The whole crew made it to {party.destination?.name ?? 'the destination'}.
        </Text>
      </View>
      {isHost ? (
        <Button size="sm" variant="secondary" loading={busy} onPress={end} className="rounded-full px-4">
          <Text>End party</Text>
        </Button>
      ) : null}
    </Animated.View>
  );
}
