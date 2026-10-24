import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Route } from 'lucide-react-native';
import { View } from 'react-native';

export function RecentParties() {
  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent parties</Text>
      <View className="items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-8">
        <View className="rounded-2xl bg-muted p-3">
          <Icon as={Route} size={22} className="text-muted-foreground" />
        </View>
        <Text className="font-semibold">No trips yet</Text>
        <Text className="text-center text-xs text-muted-foreground">
          Parties you create or join will show up here.
        </Text>
      </View>
    </View>
  );
}
