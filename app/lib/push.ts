import { supabase } from '@/lib/supabase';
import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';

/**
 * Push notifications through Expo's push service. The server (party_pings and friends) decides
 * who gets what; this file registers the device, sets up Android channels, decides what shows
 * while the app is open, and opens the party when a notification is tapped.
 */

// Dev builds made before push was added don't have its native side, and importing it there
// crashes the app. Load it only when it's there; everything below no-ops without it.
const Notifications: typeof NotificationsModule | null = requireOptionalNativeModule('ExpoNotificationsEmitter')
  ? require('expo-notifications')
  : null;
const isDevice: boolean = requireOptionalNativeModule('ExpoDevice') ? require('expo-device').isDevice : true;

let token: string | null = null;

/** The party whose screens are open; its own toasts already cover what a banner would say. */
let openPartyId: string | null = null;
export function setOpenParty(id: string | null) {
  openPartyId = id;
}

Notifications?.setNotificationHandler({
  handleNotification: async (n) => {
    const data = n.request.content.data as { partyId?: string; kind?: string } | undefined;
    const covered = AppState.currentState === 'active' && data?.partyId === openPartyId && data?.kind !== 'sos';
    return { shouldShowBanner: !covered, shouldShowList: !covered, shouldPlaySound: !covered, shouldSetBadge: false };
  },
});

async function ensureChannels(Notifications: typeof NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('pings', {
    name: 'Party pings',
    description: 'Stops, wait-ups, joins and arrivals from your party',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#E2725B',
  });
  await Notifications.setNotificationChannelAsync('sos', {
    name: 'SOS',
    description: 'Someone in your party needs help',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 600, 200, 600, 200, 600],
    lightColor: '#E5484D',
    bypassDnd: true,
  });
}

/**
 * Registers this device for the signed-in user. With `ask`, shows the OS prompt if it hasn't
 * been answered yet; without it, only picks up a permission that's already granted.
 */
export async function registerForPush(ask: boolean) {
  if (!Notifications) return;
  try {
    await ensureChannels(Notifications);
    if (!isDevice && Platform.OS === 'android') return; // emulators have no FCM
    let perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted' && ask && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (perm.status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const next = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.rpc('register_push_token', { token: next, platform: Platform.OS });
    if (error) throw error;
    token = next;
  } catch (e) {
    // No FCM config in this build, simulator without APNs, offline: in-app pings still work.
    console.warn('[push] registration failed:', (e as Error).message);
  }
}

/** Call before signing out, so this device stops getting the old account's pushes. */
export async function unregisterForPush() {
  if (!token) return;
  await supabase.rpc('unregister_push_token', { token }).then(
    () => {},
    () => {}
  );
  token = null;
}

function openFrom(response: NotificationsModule.NotificationResponse | null) {
  const partyId = (response?.notification.request.content.data as { partyId?: string } | undefined)?.partyId;
  if (!partyId) return;
  router.push({ pathname: '/party/[id]/map', params: { id: partyId } });
}

/** Opens the party for a tapped notification, including the one that launched the app. */
export function listenForTaps() {
  if (!Notifications) return;
  const launch = Notifications.getLastNotificationResponse();
  if (launch) {
    Notifications.clearLastNotificationResponse();
    // Let the navigator mount first.
    setTimeout(() => openFrom(launch), 300);
  }
  const sub = Notifications.addNotificationResponseReceivedListener(openFrom);
  return () => sub.remove();
}
