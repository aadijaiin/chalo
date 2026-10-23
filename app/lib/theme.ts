import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

// Mirrors the CSS variables in global.css for places that need raw colors
// (navigation theme, map styles, native props that don't accept className).
export const THEME = {
  light: {
    background: 'hsl(40 33% 97%)',
    foreground: 'hsl(25 12% 14%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(25 12% 14%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(25 12% 14%)',
    primary: 'hsl(10 70% 62%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(36 24% 92%)',
    secondaryForeground: 'hsl(25 12% 14%)',
    muted: 'hsl(36 22% 93%)',
    mutedForeground: 'hsl(25 6% 46%)',
    accent: 'hsl(36 24% 90%)',
    accentForeground: 'hsl(25 12% 14%)',
    destructive: 'hsl(0 72% 55%)',
    border: 'hsl(30 16% 87%)',
    input: 'hsl(30 16% 85%)',
    ring: 'hsl(10 70% 62%)',
    sage: 'hsl(152 16% 48%)',
    radius: '0.875rem',
  },
  dark: {
    background: 'hsl(120 6% 7%)',
    foreground: 'hsl(40 20% 96%)',
    card: 'hsl(120 5% 10%)',
    cardForeground: 'hsl(40 20% 96%)',
    popover: 'hsl(120 5% 10%)',
    popoverForeground: 'hsl(40 20% 96%)',
    primary: 'hsl(11 76% 65%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(120 4% 15%)',
    secondaryForeground: 'hsl(40 20% 96%)',
    muted: 'hsl(120 4% 14%)',
    mutedForeground: 'hsl(40 5% 62%)',
    accent: 'hsl(120 4% 17%)',
    accentForeground: 'hsl(40 20% 96%)',
    destructive: 'hsl(0 68% 58%)',
    border: 'hsl(120 4% 18%)',
    input: 'hsl(120 4% 20%)',
    ring: 'hsl(11 76% 65%)',
    sage: 'hsl(152 18% 58%)',
    radius: '0.875rem',
  },
};

// OpenFreeMap: free, open-source vector tiles. No API key, no signup.
export const MAP_STYLE = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
