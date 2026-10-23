import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { forgotSchema, type ForgotValues } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { toast } from 'sonner-native';

export default function ForgotPassword() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      haptics.error();
      toast.error(error.message);
      return;
    }
    haptics.success();
    setSentTo(email);
  }, () => haptics.error());

  if (sentTo) {
    return (
      <AuthShell back title="Check your inbox" subtitle={`We sent a reset link to ${sentTo}.`}>
        <View className="items-center py-6">
          <Animated.View entering={ZoomIn.springify()} className="rounded-full bg-sage/15 p-6">
            <Icon as={MailCheck} size={48} className="text-sage" />
          </Animated.View>
        </View>
        <Button size="lg" variant="outline" onPress={() => router.back()}>
          <Text>Back to sign in</Text>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell back title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FormField
            label="Email"
            icon={Mail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={() => onSubmit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Button size="lg" loading={isSubmitting} onPress={() => onSubmit()}>
        <Text>Send reset link</Text>
      </Button>
    </AuthShell>
  );
}
