import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { ThemeSegmented } from '@/components/theme-segmented';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LogOut, X } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { profile } = useAuth();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    // The (app) layout redirects to sign in once the session clears.
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row justify-end px-4 pt-2">
        <PressableScale
          onPress={() => router.back()}
          accessibilityLabel="Close"
          className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon as={X} size={18} />
        </PressableScale>
      </View>

      <View className="flex-1 gap-8 px-6">
        {profile ? (
          <Animated.View entering={FadeInDown.duration(400)} className="items-center gap-3">
            <View className="rounded-full border-4 border-primary/30 p-1">
              <AvatarView avatar={profile.avatar} size={96} />
            </View>
            <View className="items-center">
              <Text className="text-2xl font-extrabold">{profile.fullName || profile.username}</Text>
              <Text className="text-sm text-muted-foreground">@{profile.username}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(400).delay(100)} className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Appearance
          </Text>
          <ThemeSegmented />
        </Animated.View>

        <Separator />

        <Animated.View entering={FadeInDown.duration(400).delay(200)} className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </Text>
          <Text className="text-base">{profile?.email}</Text>
        </Animated.View>

        <View className="flex-1" />
        <Button size="lg" variant="outline" loading={signingOut} onPress={signOut}>
          <Icon as={LogOut} size={18} className="text-destructive" />
          <Text className="text-destructive">Sign out</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
