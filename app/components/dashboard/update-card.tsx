import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { motion } from '@/lib/motion';
import { checkForUpdate, dismissUpdate, type Release } from '@/lib/updates';
import { Download, X } from 'lucide-react-native';
import * as React from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

/** Offers a newer APK from the website, since there's no store to update the app. */
export function UpdateCard() {
  const [release, setRelease] = React.useState<Release | null>(null);

  React.useEffect(() => {
    checkForUpdate().then(setRelease);
  }, []);

  if (!release) return null;
  return (
    <Animated.View entering={motion.rise()} exiting={FadeOut.duration(200)} layout={LinearTransition}>
      <PressableScale
        onPress={() => Linking.openURL(release.url)}
        scaleTo={0.98}
        className="flex-row items-center gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-4">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <Icon as={Download} size={18} className="text-primary" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-primary">Update available</Text>
          <Text className="text-base font-bold">chalo {release.version}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {release.notes ?? 'Tap to download the new version, then open it to install.'}
          </Text>
        </View>
        <PressableScale
          onPress={() => {
            dismissUpdate(release.version);
            setRelease(null);
          }}
          accessibilityLabel="Not now"
          className="h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Icon as={X} size={14} className="text-muted-foreground" />
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
}
