import { AuthShell, FooterLink } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginValues } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, type TextInput } from 'react-native';
import { toast } from 'sonner-native';

export default function Login() {
  const passwordRef = React.useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      haptics.error();
      toast.error(error.message === 'Email not confirmed' ? 'Confirm your email first' : error.message);
      return;
    }
    haptics.success();
    // The (auth) layout redirects to the map as soon as the session lands.
  }, () => haptics.error());

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to find your crew."
      footer={
        <FooterLink prompt="New to chalo?" action="Create an account" onPress={() => router.replace('/register')} />
      }>
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
            placeholder="Your password"
            secure
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Pressable onPress={() => router.push('/forgot-password')} className="-mt-1 self-end" hitSlop={8}>
        <Text className="text-sm font-semibold text-primary">Forgot password?</Text>
      </Pressable>
      <Button size="lg" loading={isSubmitting} onPress={onSubmit} className="mt-2">
        <Text>Sign in</Text>
      </Button>
    </AuthShell>
  );
}
