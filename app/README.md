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
  (app)/             home, solo map, profile, party/new, party/[id] (lobby + live map), join/[code]
components/ui/       Reusables components (CLI-managed)
components/          app components (avatar, map marker, form field…)
hooks/               use-live-location, use-party
lib/                 supabase client, auth, theme, avatars, parties API, party-live (Realtime presence)
```

## Testing a party with two people

Run the iOS simulator next to your phone and sign in as a second account:

```bash
npx expo run:ios --device "iPhone 18 Pro" --no-bundler        # with `npm start` already running
xcrun simctl location booted set 28.7405,77.5110                 # park the simulator somewhere
xcrun simctl location booted start --speed=14 28.74,77.51 28.75,77.50   # or make it drive (m/s)
```
