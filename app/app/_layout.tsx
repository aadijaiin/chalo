import '@/global.css';

import { AuthProvider } from '@/lib/auth';
import { ConfirmHost } from '@/lib/confirm';
import { installErrorReporting, reportError } from '@/lib/errors';
// Registers the background location task at startup, before the OS can deliver fixes to it.
import '@/lib/sharing';
import { NAV_THEME } from '@/lib/theme';
import { ThemePreferenceProvider, useThemePreference } from '@/lib/theme-preference';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { PortalHost } from '@rn-primitives/portal';
import { ErrorBoundary as RouterErrorBoundary, Stack, type ErrorBoundaryProps } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

installErrorReporting();

/** Expo Router's error screen, after reporting what broke. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  React.useEffect(() => reportError(props.error, true), [props.error]);
  return <RouterErrorBoundary {...props} />;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemePreferenceProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ThemePreferenceProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colorScheme } = useColorScheme();
  const { isReady } = useThemePreference();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  React.useEffect(() => {
    if (fontsLoaded && isReady) SplashScreen.hideAsync();
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) return null;

  const scheme = colorScheme ?? 'light';

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
      </Stack>
      <ConfirmHost />
      <Toaster
        position="top-center"
        offset={insets.top + 8}
        gap={8}
        visibleToasts={3}
        swipeToDismissDirection="up"
      />
      <PortalHost />
    </ThemeProvider>
  );
}
