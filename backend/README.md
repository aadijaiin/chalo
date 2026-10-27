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
