import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboarded: 'chalo:onboarded',
  theme: 'chalo:theme',
} as const;

export type ThemePreference = 'system' | 'light' | 'dark';

export const preferences = {
  async hasOnboarded() {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === '1';
  },
  setOnboarded() {
    return AsyncStorage.setItem(KEYS.onboarded, '1');
  },
  async getTheme(): Promise<ThemePreference> {
    const value = await AsyncStorage.getItem(KEYS.theme);
    return value === 'light' || value === 'dark' ? value : 'system';
  },
  setTheme(value: ThemePreference) {
    return AsyncStorage.setItem(KEYS.theme, value);
  },
};
