import { Backdrop } from '@/components/backdrop';
import { LogoMark } from '@/components/logo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { isSupabaseConfigured } from '@/lib/supabase';
import { router } from 'expo-router';
import { ChevronLeft, TriangleAlert } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthShellProps = {
  title: string;
  subtitle: string;
  back?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ title, subtitle, back, children, footer }: AuthShellProps) {
  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="grow px-6 pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="h-12 flex-row items-center">
              {back && router.canGoBack() ? (
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  className="-ml-2 h-10 w-10 items-center justify-center rounded-full active:bg-accent">
                  <Icon as={ChevronLeft} size={24} />
                </Pressable>
              ) : null}
            </View>

            <Animated.View entering={FadeInDown.duration(500)} className="mb-8 mt-4 gap-3">
              <LogoMark size={44} />
              <Text className="text-3xl font-extrabold tracking-tight">{title}</Text>
              <Text className="text-base text-muted-foreground">{subtitle}</Text>
            </Animated.View>

            {!isSupabaseConfigured ? (
              <View className="mb-6 flex-row gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <Icon as={TriangleAlert} size={18} className="text-primary" />
                <Text className="flex-1 text-sm">
                  Supabase isn't configured yet. Add your project URL and key to{' '}
                  <Text className="text-sm font-bold">app/.env</Text> (see app/README.md).
                </Text>
              </View>
            ) : null}

            <Animated.View entering={FadeInDown.duration(500).delay(120)} className="gap-5">
              {children}
            </Animated.View>

            <View className="flex-1" />
            {footer ? (
              <Animated.View entering={FadeInDown.duration(500).delay(240)} className="mt-8">
                {footer}
              </Animated.View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="items-center py-2">
      <Text className="text-sm text-muted-foreground">
        {prompt} <Text className="text-sm font-bold text-primary">{action}</Text>
      </Text>
    </Pressable>
  );
}
