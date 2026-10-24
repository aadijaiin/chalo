import { useAuth } from '@/lib/auth';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();
  if (session) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />;
}
