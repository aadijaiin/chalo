import { preferences, type ThemePreference } from '@/lib/preferences';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

type ThemePreferenceValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  isReady: boolean;
};

const ThemePreferenceContext = React.createContext<ThemePreferenceValue>({
  preference: 'system',
  setPreference: () => {},
  isReady: false,
});

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemePreference>('system');
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    preferences
      .getTheme()
      .then((stored) => {
        setPreferenceState(stored);
        setColorScheme(stored);
      })
      .finally(() => setIsReady(true));
  }, [setColorScheme]);

  const setPreference = React.useCallback(
    (value: ThemePreference) => {
      setPreferenceState(value);
      setColorScheme(value);
      preferences.setTheme(value);
    },
    [setColorScheme]
  );

  const value = React.useMemo(
    () => ({ preference, setPreference, isReady }),
    [preference, setPreference, isReady]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  return React.useContext(ThemePreferenceContext);
}
