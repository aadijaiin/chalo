# chalo — backend

No servers to run. The backend is a [Supabase](https://supabase.com) project
(Postgres + Auth + Realtime) on the free tier, which needs no credit card.
This folder holds its config and SQL migrations.

## One-time setup

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Apply the migrations, using either option:
   - **Dashboard:** open *SQL Editor*, paste the files in `supabase/migrations/` (in order) and run them.
   - **CLI:**
     ```bash
     npx supabase login
     npx supabase link --project-ref <your-project-ref>
     npx supabase db push
     ```
3. Copy *Project Settings → API → Project URL* and the *publishable* (or *anon*) key into `app/.env`.
4. *(Recommended while developing)* Turn off *Authentication → Sign In / Providers → Email → Confirm email*.
   The free built-in mailer only sends a few emails per hour. The app handles both modes.

## What's here

- `supabase/migrations/…_profiles.sql`: the `profiles` table (username, name, avatar), row-level
  security, and a trigger that creates the profile from sign-up metadata.

- `supabase/migrations/…_parties.sql`: `parties` and `party_members`, readable only by members,
  plus the `create_party` / `join_party` / `leave_party` / `end_party` RPCs that issue and check the
  6-character codes. Both tables are on Realtime so lobbies update live.

- `supabase/migrations/…_party_live_location.sql`: superseded by the next migration (kept for history).
- `supabase/migrations/…_background_sharing_one_party.sql`: `party_locations` holds each member's
  latest fix only (overwritten in place, deleted on leave/end), written by `share_location()` so a
  backgrounded phone can post over plain HTTP. Create/join refuse while you're live in another party
  unless the app passes `replace_current` after the user confirms.
- `supabase/migrations/…_auto_end_and_quieter_sharing.sql`: parties end on their own after 24 h, or
  after 2 h with nobody sharing (a `pg_cron` job runs `end_stale_parties()` every 5 min), and
  `parties.ended_reason` records why. `share_location()` skips near-duplicate writes, since each
  write is fanned out to the whole party over Realtime.
- `supabase/migrations/…_destination_and_eta.sql`: the host sets a party destination
  (`set_destination()`). Each phone routes itself there and posts `eta_s` / `remaining_m` with its
  location; `share_location()` returns the current destination so a locked phone notices changes.
- `supabase/migrations/…_pings_and_push.sql`: `party_pings` (chai, fuel, food, wait up, SOS,
  arrivals) and `push_tokens`. Triggers push pings, joins, arrivals and the party ending to every
  other member through Expo's push service, straight from Postgres with `pg_net`.
- `supabase/migrations/…_ping_status.sql`: pings become statuses you can end (`clear_ping()`);
  cancelling an SOS tells everyone you're OK.
- `supabase/migrations/…_custom_ping.sql`: a custom stop with your own message.
- `supabase/migrations/…_party_pins.sql`: `party_pins`, shared stops, meetup points and notes on
  the party map (`add_pin` / `update_pin` / `remove_pin`); adding a stop or meetup pushes to the party.
- `supabase/migrations/…_stops_and_behind.sql`: every stop pin is a waypoint on everyone's route
  (`share_location()` returns them with the destination), and a server-set `behind` status with a
  push when someone falls 5 km behind the lead; it clears itself once they're within 3 km.
