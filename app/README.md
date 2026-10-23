# chalo — mobile app

Expo (React Native) app. This is where all of chalo's features live.

| Concern | Choice | Cost |
| --- | --- | --- |
| Framework | Expo SDK 57 + expo-router | free |
| UI | [React Native Reusables](https://reactnativereusables.com) (shadcn for RN) + NativeWind | free, OSS |
| Animation | Reanimated 4 + expo-haptics | free, OSS |
| Auth / DB | [Supabase](https://supabase.com) free tier | free, no card |
| Maps | [MapLibre Native](https://maplibre.org) + [OpenFreeMap](https://openfreemap.org) tiles | free, OSS, no key |
| Avatars | [DiceBear](https://dicebear.com), generated on device | free, OSS |

## 1. Configure Supabase

See [`../backend/README.md`](../backend/README.md), then:

```bash
cp .env.example .env   # paste your project URL + publishable key
```

## 2. Run it

MapLibre is a native module, so **Expo Go won't work**: you need a *development build*.
It's a one-time build. After that, JS changes hot-reload like Expo Go.

**Android, no local SDK (recommended):** build in Expo's cloud on the free plan (no card needed).

```bash
npm install
npx eas-cli login              # free expo.dev account
npx eas-cli init               # links the project (one time)
npm run build:android          # ~10–15 min, then install the APK on your phone
npm start                      # open the installed app; it connects to this dev server
```

**Android with Android Studio installed:** `npm run android`
**iOS simulator (needs Xcode from the App Store):** `npm run ios`

Only rebuild when you add or upgrade a native package. Otherwise `npm start` is enough.

## Adding UI components

```bash
npx @react-native-reusables/cli@latest add -y dialog tabs   # etc.
```

## Structure

```
app/                 routes (expo-router)
  index.tsx          gate: map / onboarding / sign in
  onboarding.tsx
  (auth)/            login, register, forgot-password
  (app)/             map, profile (signed-in only)
components/ui/       Reusables components (CLI-managed)
components/          app components (avatar, map marker, form field…)
hooks/               use-live-location
lib/                 supabase client, auth context, theme, avatar helpers
```
