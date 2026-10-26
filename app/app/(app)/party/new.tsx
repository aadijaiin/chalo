import { AvatarView } from '@/components/avatar-view';
import { FormField } from '@/components/form-field';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { usePartyActions } from '@/hooks/use-party-actions';
import { useAuth } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { Flag, X } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUGGESTIONS = ['Road trip', 'Night ride', 'Weekend getaway', 'Concert crew', 'Trek day'];
const MAX_NAME = 40;

const enter = (i: number) => FadeInDown.duration(400).delay(70 * i);

export default function NewParty() {
  const { profile } = useAuth();
  const firstName = profile?.fullName.split(' ')[0] || profile?.username || 'My';
  const [name, setName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const actions = usePartyActions();

  const placeholder = `${firstName}'s trip`;

  async function create() {
    const finalName = (name.trim() || placeholder).slice(0, MAX_NAME);
    setCreating(true);
    try {
      const party = await actions.create(finalName);
      if (!party) return setCreating(false);
      haptics.success();
      router.replace({ pathname: '/party/[id]', params: { id: party.id } });
    } catch (e) {
      setCreating(false);
      notify.error("Couldn't start the party", (e as Error).message);
    }
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

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow gap-7 px-6 pb-6" keyboardShouldPersistTaps="handled">
          <Animated.View entering={enter(0)} className="gap-4">
            {profile ? (
              <View className="self-start rounded-full border-2 border-primary/30 p-0.5">
                <AvatarView avatar={profile.avatar} size={56} />
              </View>
            ) : null}
            <View className="gap-1">
              <Text className="text-3xl font-extrabold tracking-tight">Start a party</Text>
              <Text className="text-sm text-muted-foreground">
                You'll get a code to share. Everyone who joins shows up on one live map.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={enter(1)} className="gap-3">
            <FormField
              label="Party name"
              icon={Flag}
              value={name}
              onChangeText={(t) => setName(t.slice(0, MAX_NAME))}
              placeholder={placeholder}
              autoCapitalize="words"
              returnKeyType="go"
              onSubmitEditing={create}
            />
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTIONS.map((s) => {
                const selected = name === s;
                return (
                  <PressableScale
                    key={s}
                    onPress={() => {
                      haptics.select();
                      setName(selected ? '' : s);
                    }}
                    className={cn(
                      'rounded-full border px-3.5 py-2',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}>
                    <Text className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
                      {s}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          <View className="flex-1" />

          <Animated.View entering={enter(2)}>
            <Button size="lg" loading={creating} onPress={create}>
              <Text>Create party</Text>
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
