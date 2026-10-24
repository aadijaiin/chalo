import { AuthShell, FooterLink } from '@/components/auth-shell';
import { AvatarPicker } from '@/components/avatar-picker';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { randomSeed, type AvatarConfig } from '@/lib/avatar';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { registerSchema, type RegisterValues } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { AtSign, Lock, Mail, MailCheck, User } from 'lucide-react-native';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, type TextInputInstance } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { notify } from '@/lib/notify';

export default function Register() {
  const [avatar, setAvatar] = React.useState<AvatarConfig>(() => ({
    style: 'adventurer',
    seed: randomSeed(),
  }));
  const [confirmEmail, setConfirmEmail] = React.useState<string | null>(null);
  const usernameRef = React.useRef<TextInputInstance>(null);
  const emailRef = React.useRef<TextInputInstance>(null);
  const passwordRef = React.useRef<TextInputInstance>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          username: values.username,
          avatar_style: avatar.style,
          avatar_seed: avatar.seed,
        },
      },
    });
    if (error) {
      // The profiles trigger rejects duplicate usernames, which surfaces as a generic DB error.
      if (error.message.includes('Database error')) notify.error('Username taken', 'Try a different one.');
      else notify.error("Couldn't create your account", error.message);
      return;
    }
    haptics.success();
    // With email confirmation on, Supabase returns no session until the link is clicked.
    if (!data.session) setConfirmEmail(values.email);
  }, () => haptics.error());

  if (confirmEmail) {
    return (
      <AuthShell title="Confirm your email" subtitle={`We sent a confirmation link to ${confirmEmail}. Tap it, then sign in.`}>
        <View className="items-center py-6">
          <Animated.View entering={ZoomIn.springify()} className="rounded-full bg-sage/15 p-6">
            <Icon as={MailCheck} size={48} className="text-sage" />
          </Animated.View>
        </View>
        <Button size="lg" onPress={() => router.replace('/login')}>
          <Text>Go to sign in</Text>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Pick a look. This is how your crew will see you on the map."
      footer={<FooterLink prompt="Already have an account?" action="Sign in" onPress={() => router.replace('/login')} />}>
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormField
            label="Full name"
            icon={User}
            placeholder="Aanya Sharma"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <FormField
            ref={usernameRef}
            label="Username"
            icon={AtSign}
            placeholder="aanya_rides"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.username?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FormField
            ref={emailRef}
            label="Email"
            icon={Mail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormField
            ref={passwordRef}
            label="Password"
            icon={Lock}
            placeholder="At least 8 characters"
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => onSubmit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button size="lg" loading={isSubmitting} onPress={() => onSubmit()} className="mt-2">
        <Text>Create account</Text>
      </Button>
      <Text className="text-center text-xs text-muted-foreground">
        By continuing you agree to share your location only with parties you join.
      </Text>
    </AuthShell>
  );
}
