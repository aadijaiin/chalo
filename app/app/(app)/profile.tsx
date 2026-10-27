import { AvatarView } from '@/components/avatar-view';
import { PressableScale } from '@/components/pressable-scale';
import { ThemeSegmented } from '@/components/theme-segmented';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { notify } from '@/lib/notify';
import { unregisterForPush } from '@/lib/push';
import { useSharing } from '@/lib/sharing';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LogOut, Trash2, X } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { profile } = useAuth();
  const [signingOut, setSigningOut] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const sharing = useSharing();

  async function signOut() {
    setSigningOut(true);
    // Nobody should keep receiving your position after you sign out of this phone.
    await sharing.stop();
    // Or pushes: this device would keep getting the old account's pings.
    await unregisterForPush();
    await supabase.auth.signOut();
    // The (app) layout redirects to sign in once the session clears.
  }

  async function deleteAccount() {
    const ok = await confirm({
      icon: Trash2,
      title: 'Delete your account?',
      message:
        'This removes your profile, location history, pings and party memberships for good. Parties you host are handed to someone else in them. This can’t be undone.',
      confirmLabel: 'Delete account',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    // Stop sharing and pushes first; both need the session that deleting the account ends.
    await sharing.stop();
    await unregisterForPush();
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      haptics.error();
      notify.error("Couldn't delete your account", error.message);
      setDeleting(false);
      return;
    }
    // The account is gone server-side, so only clear this device's session.
    await supabase.auth.signOut({ scope: 'local' });
    notify.success('Account deleted', 'Everything linked to it has been removed.');
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
        <View className="gap-2">
          <Button size="lg" variant="outline" loading={signingOut} disabled={deleting} onPress={signOut}>
            <Icon as={LogOut} size={18} className="text-destructive" />
            <Text className="text-destructive">Sign out</Text>
          </Button>
          <Button variant="ghost" loading={deleting} disabled={signingOut} onPress={deleteAccount}>
            <Text className="text-sm text-muted-foreground">Delete account</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
