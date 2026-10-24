import { haptics } from '@/lib/haptics';
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

// Theme changes re-color the tree in place: NativeWind swaps CSS variables and
// nothing keys off the scheme, so no screen (or map) remounts on toggle.
export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemePreference>('system');
  const [isReady, setIsReady] = React.useState(false);

  // Restore once on launch. setColorScheme's identity changes with the scheme, so
  // depending on it would re-read storage mid-toggle and revert the user's choice.
  React.useEffect(() => {
    preferences
      .getTheme()
      .then((stored) => {
        setPreferenceState(stored);
        setColorScheme(stored);
      })
      .finally(() => setIsReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreference = React.useCallback(
    (value: ThemePreference) => {
      haptics.select();
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
