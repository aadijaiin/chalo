import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

export const haptics = {
  tap: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  select: () => enabled && Haptics.selectionAsync(),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
