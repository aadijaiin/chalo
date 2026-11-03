# Publishing chalo on Google Play

Everything here works without a Mac or an Apple account. Builds run on Expo's servers (EAS, free
plan), so you don't need Android Studio either.

## 0. What you need

- A **Google Play developer account**: [play.google.com/console/signup](https://play.google.com/console/signup),
  a one-time **US $25** fee, plus identity verification (a government ID; takes a day or two).
- Your Expo account (the one already linked to this project, `aadijaiin`).
- About **12 people with Android phones** willing to test for two weeks (see step 6). Friends who'd
  use chalo on a trip are perfect.

## 1. Before the first build

1. Pick the version people will see. In `app/app.json`, change `"version": "0.1.0"` to `"1.0.0"`.
   The build number (`versionCode`) is handled by EAS and goes up by itself on every build.
2. Make sure the database is up to date: `cd backend && supabase db push --linked`.
3. Back up the signing key. EAS made one for this project the first time you built; download it once
   with `npx eas-cli credentials -p android` → *Download credentials* and keep it somewhere safe
   (a password manager, not the repo). Losing it means you can never update the app.

## 2. Build the app bundle

```bash
cd app
npm run build:play        # eas build --profile production --platform android
```

This makes an `.aab` (the format Play wants) on Expo's servers in 10–20 minutes. The Supabase URL,
publishable key and site URL are baked in from the `production` profile in `eas.json`.

Want to try the release build on your own phone first? `npx eas-cli build --profile preview -p android`
gives an installable `.apk` with the same settings. (If the dev build is installed, uninstall it
first; they share the package name.)

## 3. Create the app in Play Console

*Create app* → name **chalo**, default language English (India), **App**, **Free**, accept the
declarations.

## 4. App content (Policy → App content)

Play won't let you release until each of these is done.

| Section | What to enter |
| --- | --- |
| **Privacy policy** | `https://chalo.aadijain.dev/privacy` |
| **App access** | *All or some functionality is restricted*. Make a reviewer account in the app (e.g. `playreview@…`), and give its email and password with the note: "Create a party from Home → Start a party. Location sharing needs location permission." |
| **Ads** | No ads |
| **Content rating** | Fill in the questionnaire. Answer *yes* to "shares the user's physical location with other users" and "users can interact"; everything else *no*. |
| **Target audience** | 18 and over (location sharing between people is simplest to keep for adults; anything under 13 pulls in the Families policy) |
| **News app** | No |
| **Data safety** | See the table below |
| **Government app / Financial features / Health** | No / None / None |
| **Account deletion** | Yes, in the app (*Profile → Delete account*) and on the web: `https://chalo.aadijain.dev/delete-account` |

### Data safety answers

Collected and shared: *Is data encrypted in transit?* **Yes**. *Can users request deletion?* **Yes**.

| Data type | Collected | Shared* | Purpose | Optional? |
| --- | --- | --- | --- | --- |
| Precise location | Yes | Yes, with the party | App functionality | No (it's the app) |
| Approximate location | Yes | Yes, with the party | App functionality | No |
| Name, email | Yes | Name with the party | Account management, app functionality | No |
| User IDs | Yes | No | Account management | No |
| Other user-generated content (pings, pins, messages) | Yes | Yes, with the party | App functionality | Yes |
| Crash logs, diagnostics (error reports) | Yes | No | App functionality (fixing bugs) | No |
| Device or other IDs (push token) | Yes | No | App functionality (notifications) | Yes |

\*Play counts showing data to other users the person chose to share with as *sharing*. Nothing
is sold or used for ads; say so.

### Sensitive permissions (Policy → App content → Sensitive permissions)

chalo asks for **background location** and runs a **location foreground service**. Both need a
declaration and a short video:

1. **Location permissions**: core feature = "Live location sharing with your party during a trip,
   including while the phone is locked, until you leave the party or it ends." Explain that
   without it the crew loses you as soon as your screen turns off.
2. **Foreground service permissions**: type *location*, same explanation; the user sees a
   persistent "Sharing your location · <party>" notification while it runs.
3. **Video** (unlisted YouTube link, under 30 s, screen recording from the phone): start a party →
   the *"Keep sharing when your phone is locked?"* sheet (this is the prominent disclosure Play
   requires; it's already in the app) → *Continue* → Android's *Allow all the time* → lock the phone
   and show the sharing notification.

## 5. Store listing (Grow → Store presence → Main store listing)

Graphics are ready in `store/android/` (regenerate with `python3 store/make-assets.py`):

- App icon: `icon-512.png`
- Feature graphic: `feature-graphic.png`
- Phone screenshots: everything in `screenshots/` (1080×1920)

Text you can paste:

- **App name:** chalo: group location sharing
- **Short description (80 max):** Live location for road trips and group rides. Everyone on one map.
- **Full description:**

  > Start a party and everyone in it shows up on one live map, with their own avatar, route and ETA.
  > Built for road trips, group rides and treks, so nobody gets lost on the way.
  >
  > • Everyone on one map: share a six-character code and the crew pops in, live.
  > • Destination and ETAs: set where you're headed; everyone gets a route and an arrival time.
  > • One-tap pings: chai stop, fuel, food, wait up, or your own words.
  > • SOS that can't go off by accident, and alerts when someone falls behind.
  > • Stops and meetups on the map, saved offline maps for no-signal stretches.
  > • Lookouts: let family follow the trip from home without sharing their location. The host
  >   lets each one in, and anyone can hide from lookouts.
  > • A trip recap at the end: everyone's route, distance and top speed.
  >
  > Your location is shared only with the party you join, only while you're in it. Parties end
  > by themselves after 24 hours. No ads, and we don't sell your data.

- **Category:** Travel & Local. **Contact email:** your support address (also set
  `NEXT_PUBLIC_CONTACT_EMAIL` on Vercel so the privacy page shows it).

## 6. Testing, then production

New personal developer accounts must run a **closed test with at least 12 testers for 14 days in a
row** before they can publish to production.

1. *Testing → Internal testing*: create a release and upload the `.aab` from step 2 (download it
   from the build page on expo.dev). Add yourself as a tester and install it from the opt-in link.
   Check sign-in, a party with two phones, background sharing, a lookout and the watch link.
2. *Testing → Closed testing*: create a track, add your 12+ testers (a Google Group or emails),
   upload the same build, and send them the opt-in link. Keep at least 12 opted in for 14 days.
3. *Production → Apply for production access* once the 14 days are up. Then create a production
   release with the build, roll it out (a staged rollout of 20% first is sensible), and wait for
   review (usually a few days; background location apps often take longer).

## 7. Later releases (one command)

The first upload has to be by hand (step 6.1). After that `eas submit` can upload for you:

1. Google Cloud console → create a service account → create a JSON key.
2. Play Console → *Users and permissions* → invite the service account's email with *Release
   apps to testing tracks* (and *production* when you're ready).
3. Save the key as `app/play-service-account.json` (it's gitignored).

```bash
cd app
npm run build:play && npm run submit:play   # uploads the newest build to the internal track as a draft
```

Promote it to closed testing or production from Play Console.

## 8. After it's live

- On Vercel, set `NEXT_PUBLIC_PLAY_STORE_URL` to the Play listing URL; the website's "Coming soon"
  turns into a *Get it on Google Play* button, and invite pages stay the same.
- Check `app_errors` in the Supabase dashboard now and then for crashes from real phones.
