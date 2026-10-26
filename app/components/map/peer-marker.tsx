import { AvatarView } from '@/components/avatar-view';
import { Text } from '@/components/ui/text';
import type { AvatarConfig } from '@/lib/avatar';
import { View } from 'react-native';

/** Another party member's pin: name tag, avatar in their ring color, and a pointer. Anchor it at the bottom. */
export function PeerMarker({
  avatar,
  name,
  color,
  online,
  size = 40,
}: {
  avatar: AvatarConfig;
  name: string;
  color: string;
  online: boolean;
  size?: number;
}) {
  return (
    <View className="items-center" style={{ opacity: online ? 1 : 0.55 }}>
      <View className="mb-1 rounded-full px-2 py-0.5" style={{ backgroundColor: color }}>
        <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View className="rounded-full p-[3px] shadow-lg shadow-black/30" style={{ backgroundColor: color }}>
        <View className="rounded-full bg-white p-[2px]">
          <AvatarView avatar={avatar} size={size} />
        </View>
      </View>
      <View className="-mt-[5px] h-3 w-3 rotate-45" style={{ backgroundColor: color, borderBottomRightRadius: 2 }} />
    </View>
  );
}
