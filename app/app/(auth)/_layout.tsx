import { useAuth } from '@/lib/auth';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();
  if (session) return <Redirect href="/map" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
