import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PIN_META, type PinKind } from '@/lib/pins';
import { THEME } from '@/lib/theme';
import { View } from 'react-native';

// Stops and meetups stand out; notes stay quiet so they don't crowd the map.
export const PIN_COLORS: Record<PinKind, string> = {
  stop: 'hsl(200 62% 48%)',
  meetup: 'hsl(262 48% 60%)',
  note: THEME.light.mutedForeground,
};

/** A shared pin on the map: a tinted square with the kind's icon, and its name. Anchor at the bottom. */
export function PinMarker({ kind, name, selected }: { kind: PinKind; name: string; selected?: boolean }) {
  const color = PIN_COLORS[kind];
  return (
    <View className="items-center">
      <View className="mb-1 max-w-[140px] rounded-full bg-card px-2 py-0.5 shadow-sm shadow-black/20">
        <Text className="text-[11px] font-bold" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View
        className="items-center justify-center rounded-xl border-2 border-white shadow-lg shadow-black/30"
        style={{ backgroundColor: color, padding: selected ? 8 : 6 }}>
        <Icon as={PIN_META[kind].icon} size={selected ? 18 : 15} className="text-white" />
      </View>
      <View className="-mt-[5px] h-2.5 w-2.5 rotate-45" style={{ backgroundColor: color }} />
    </View>
  );
}
