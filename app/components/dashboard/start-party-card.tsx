import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { AvatarConfig } from '@/lib/avatar';
import { THEME } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

const CREW: AvatarConfig[] = [
  { style: 'adventurer', seed: 'kabir' },
  { style: 'adventurer', seed: 'meera' },
  { style: 'adventurer', seed: 'rohan' },
];

export function StartPartyCard({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} className="overflow-hidden rounded-3xl">
      <LinearGradient
        colors={[THEME.light.primary, 'hsl(18 78% 58%)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft decorative rings */}
      <View className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[18px] border-white/10" />
      <View className="absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/10" />

      <View className="gap-5 p-5">
        <View className="flex-row">
          {CREW.map((a, i) => (
            <View key={a.seed} className="rounded-full border-2 border-white/80" style={{ marginLeft: i ? -10 : 0 }}>
              <AvatarView avatar={a} size={34} />
            </View>
          ))}
        </View>
        <View className="gap-1">
          <Text className="text-2xl font-extrabold text-white">Start a party</Text>
          <Text className="text-sm text-white/85">Get your crew on one live map in seconds.</Text>
        </View>
        <View className="flex-row items-center gap-2 self-start rounded-full bg-white px-4 py-2.5">
          <Text className="text-sm font-bold text-primary">Create party</Text>
          <Icon as={ArrowRight} size={16} className="text-primary" />
        </View>
      </View>
    </PressableScale>
  );
}
